#!/usr/bin/env bash
# AIDC Service Request: installs (or updates) the app on an Ubuntu server.
#
#   bash setup-server.sh
#
# Run it as your normal login user in a terminal (not as root, not with sudo in front): it asks for your sudo password
# itself, only for the steps that need it. It is safe to run again: the database, the .env file and the secrets that
# are already there are kept, and a second run just pulls the latest code, migrates, rebuilds and restarts.
#
# It does, in this order, after showing you the plan and asking for a yes:
#   1. installs git, curl, openssl and PostgreSQL from apt, and Node.js (official tarball, checksum verified) if the
#      server has none or one that is too old
#   2. creates a PostgreSQL role and database for the app (random password, kept only in .env, never printed)
#   3. clones https://github.com/pradit2527/service-request.git (or pulls it) into ~/service-request
#   4. writes ~/service-request/.env (mode 600) the first time only
#   5. npm ci, database migrations, production build
#   6. installs and starts a systemd service called service-request (port 3000, restarts by itself, starts on boot)
#   7. opens port 3000 in ufw, only if ufw is active
#   8. asks for the first administrator's email and name, then the command asks for the password (typed hidden)
#
# Settings you can override on the command line, e.g.  APP_PORT=8080 bash setup-server.sh
#   APP_DIR   where the code lives            (default: ~/service-request)
#   APP_PORT  port the app listens on         (default: 3000)
#   APP_HOST  address people type in the browser, used for APP_URL (default: this server's first IP address)
#   REPO_URL  git repository to clone         (default: the GitHub one)
#   BRANCH    branch to run                   (default: main)
#   NODE_MAJOR Node.js major version to install when needed (default: 24)

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/service-request}"
APP_PORT="${APP_PORT:-3000}"
REPO_URL="${REPO_URL:-https://github.com/pradit2527/service-request.git}"
BRANCH="${BRANCH:-main}"
NODE_MAJOR="${NODE_MAJOR:-24}"
SERVICE="service-request"
DB_NAME="service-request_db"
DB_ROLE="service_request"
APP_HOST="${APP_HOST:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
APP_URL="http://${APP_HOST}:${APP_PORT}"
RUN_USER="$(id -un)"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
note() { printf '   %s\n' "$*"; }
fail() { printf '\n\033[31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }
ask_yes() { # ask_yes "question" default(Y|N)
  local answer prompt="[y/N]"
  [ "${2:-N}" = "Y" ] && prompt="[Y/n]"
  read -r -p "$1 $prompt " answer || true
  answer="${answer:-${2:-N}}"
  case "$answer" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

[ "$(id -u)" -ne 0 ] || fail "Run this as your normal user, not root. It uses sudo itself where needed."
[ -t 0 ] || fail "Run this in an interactive terminal (it asks questions and a hidden password)."
[ -n "$APP_HOST" ] || fail "Could not work out this server's IP address. Run it again as: APP_HOST=10.0.100.60 bash setup-server.sh"
command -v sudo >/dev/null || fail "sudo is not installed."

# ---------------------------------------------------------------- 0. look first, change nothing
say "What is on this server now (nothing is changed yet)"
. /etc/os-release 2>/dev/null && note "OS:          ${PRETTY_NAME:-unknown}"
note "User:        ${RUN_USER}   Address: ${APP_HOST}"

node_ok=no
if command -v node >/dev/null; then
  node_version="$(node -v | sed 's/^v//')"
  node_major="${node_version%%.*}"; rest="${node_version#*.}"; node_minor="${rest%%.*}"
  note "Node.js:     v${node_version}"
  if [ "$node_major" -gt 20 ] || { [ "$node_major" -eq 20 ] && [ "$node_minor" -ge 12 ]; }; then node_ok=yes; fi
else
  note "Node.js:     not installed"
fi
command -v psql >/dev/null && note "PostgreSQL:  $(psql --version)" || note "PostgreSQL:  not installed"
command -v git >/dev/null && note "git:         $(git --version)" || note "git:         not installed"

listener="$(ss -ltnH "sport = :${APP_PORT}" 2>/dev/null || true)"
if [ -n "$listener" ]; then
  if systemctl is-active --quiet "$SERVICE" 2>/dev/null; then
    note "Port ${APP_PORT}:   used by the ${SERVICE} service (this app, it will be restarted)"
  else
    note "Port ${APP_PORT}:   IN USE by something else:"
    ss -ltnpH "sport = :${APP_PORT}" 2>/dev/null | sed 's/^/                /' || true
    fail "Port ${APP_PORT} is taken. Free it, or choose another: APP_PORT=8080 bash setup-server.sh"
  fi
else
  note "Port ${APP_PORT}:   free"
fi

if [ -d "$APP_DIR/.git" ]; then note "App folder:  ${APP_DIR} exists (will be updated)"; else note "App folder:  ${APP_DIR} will be created"; fi
if [ -f "$APP_DIR/.env" ]; then note ".env:        exists (kept as it is)"; else note ".env:        will be created"; fi

say "Plan"
note "1. apt: git curl openssl postgresql (only what is missing)"
[ "$node_ok" = yes ] && note "2. Node.js: keep the installed one" || note "2. Node.js ${NODE_MAJOR}: download from nodejs.org, verify the checksum, install into /usr/local"
note "3. PostgreSQL: role \"${DB_ROLE}\" + database \"${DB_NAME}\" (only if missing)"
note "4. Code: ${REPO_URL} (${BRANCH}) -> ${APP_DIR}"
note "5. npm ci, migrations, build; systemd service \"${SERVICE}\" on port ${APP_PORT}; ufw rule if ufw is active"
note "6. The app will be reachable at ${APP_URL}  (plain http: cookies are not Secure, see README)"
echo
ask_yes "Go ahead?" N || { echo "Nothing was changed."; exit 0; }

say "Checking sudo (type your own password if it asks)"
sudo -v

# ---------------------------------------------------------------- 1. packages
say "1/8 Packages"
need=()
for pair in git:git curl:curl openssl:openssl psql:postgresql; do
  command -v "${pair%%:*}" >/dev/null || need+=("${pair##*:}")
done
if [ "${#need[@]}" -gt 0 ]; then
  note "installing: ${need[*]}"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y "${need[@]}"
else
  note "all present"
fi
command -v xz >/dev/null || { sudo apt-get update -y && sudo DEBIAN_FRONTEND=noninteractive apt-get install -y xz-utils; }

if [ "$node_ok" != yes ]; then
  case "$(uname -m)" in
    x86_64) arch=x64 ;;
    aarch64|arm64) arch=arm64 ;;
    *) fail "Unsupported CPU $(uname -m) for the Node.js download." ;;
  esac
  work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
  base="https://nodejs.org/dist/latest-v${NODE_MAJOR}.x"
  note "downloading Node.js ${NODE_MAJOR} from ${base}"
  curl -fsSL "$base/SHASUMS256.txt" -o "$work/SHASUMS256.txt"
  tarball="$(grep -o "node-v[0-9.]*-linux-${arch}\.tar\.xz" "$work/SHASUMS256.txt" | head -n 1)"
  [ -n "$tarball" ] || fail "No Node.js ${NODE_MAJOR} build for linux-${arch} found at nodejs.org."
  curl -fsSL "$base/$tarball" -o "$work/$tarball"
  (cd "$work" && grep " ${tarball}\$" SHASUMS256.txt | sha256sum -c -) || fail "Checksum of the Node.js download does not match."
  sudo tar -xJf "$work/$tarball" -C /usr/local --strip-components=1 --no-same-owner
  hash -r
  note "installed Node.js $(node -v), npm $(npm -v)"
fi

# ---------------------------------------------------------------- 2. database
say "2/8 PostgreSQL"
sudo systemctl enable --now postgresql >/dev/null 2>&1 || true
# Run from /tmp: the postgres user cannot enter a home folder, and psql would complain about it.
psql_admin() { (cd /tmp && sudo -u postgres psql -v ON_ERROR_STOP=1 -qAt "$@"); }
for _ in $(seq 1 20); do psql_admin -c 'SELECT 1' >/dev/null 2>&1 && break; sleep 1; done
psql_admin -c 'SELECT 1' >/dev/null 2>&1 || fail "PostgreSQL does not answer. Check: sudo systemctl status postgresql"

role_exists="$(psql_admin -c "SELECT 1 FROM pg_roles WHERE rolname = '${DB_ROLE}'")"
db_password=""
if [ -f "$APP_DIR/.env" ]; then
  note ".env already exists: keeping the database settings in it"
elif [ "$role_exists" = "1" ]; then
  note "the role \"${DB_ROLE}\" already exists but there is no .env to read its password from"
  ask_yes "Give that role a new random password (this breaks anything else using it)?" N || fail "Stopped, nothing else changed. Put a .env in ${APP_DIR} or choose another DB_ROLE."
  db_password="$(openssl rand -hex 24)"
  printf "ALTER ROLE \"%s\" WITH LOGIN PASSWORD '%s';\n" "$DB_ROLE" "$db_password" | psql_admin
else
  db_password="$(openssl rand -hex 24)"
  printf "CREATE ROLE \"%s\" WITH LOGIN PASSWORD '%s';\n" "$DB_ROLE" "$db_password" | psql_admin
  note "created role \"${DB_ROLE}\""
fi
if [ "$(psql_admin -c "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'")" = "1" ]; then
  note "database \"${DB_NAME}\" already exists"
else
  psql_admin -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_ROLE}\""
  note "created database \"${DB_NAME}\""
fi

# ---------------------------------------------------------------- 3. code
say "3/8 Code"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" merge --ff-only "origin/$BRANCH" || fail "Local changes in ${APP_DIR} stop a clean update. Look at: git -C ${APP_DIR} status"
else
  [ ! -e "$APP_DIR" ] || fail "${APP_DIR} exists and is not a git checkout. Move it away or set APP_DIR."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
note "at commit $(git -C "$APP_DIR" log -1 --format='%h %s')"

# ---------------------------------------------------------------- 4. .env
say "4/8 Settings (.env)"
if [ -f "$APP_DIR/.env" ]; then
  note "kept the existing ${APP_DIR}/.env"
  grep -q '^COOKIE_SECURE=' "$APP_DIR/.env" || note "note: it has no COOKIE_SECURE line; over plain http nobody can sign in until you add COOKIE_SECURE=\"false\" (or put https in front)"
else
  [ -n "$db_password" ] || fail "No database password to write into .env."
  umask 077
  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="postgresql://${DB_ROLE}:${db_password}@localhost:5432/${DB_NAME}?schema=public"
DIRECT_URL="postgresql://${DB_ROLE}:${db_password}@localhost:5432/${DB_NAME}?schema=public"
APP_URL="${APP_URL}"
SESSION_SECRET="$(openssl rand -hex 32)"
# Plain http inside the private network: browsers drop Secure cookies. Remove this line once https is in front.
COOKIE_SECURE="false"
ENABLE_DEV_LOGIN="false"
ALLOWED_EMAIL_DOMAINS=""
ADMIN_EMAILS=""
IT_STAFF_EMAILS=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SLA_HOLIDAYS=""
EOF
  chmod 600 "$APP_DIR/.env"
  note "wrote ${APP_DIR}/.env (readable by ${RUN_USER} only; the database password is in it, it is not shown here)"
fi
unset db_password

# ---------------------------------------------------------------- 5. build
say "5/8 Install, migrate, build (a few minutes)"
cd "$APP_DIR"
npm ci --no-audit --no-fund
npm run db:setup
npm run build

# ---------------------------------------------------------------- 6. service
say "6/8 Service"
NODE_BIN="$(command -v node)"
sudo tee "/etc/systemd/system/${SERVICE}.service" >/dev/null <<EOF
[Unit]
Description=AIDC Service Request
After=network-online.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
ExecStart=${NODE_BIN} node_modules/next/dist/bin/next start -H 0.0.0.0 -p ${APP_PORT}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE" >/dev/null 2>&1
sudo systemctl restart "$SERVICE"

# ---------------------------------------------------------------- 7. firewall
say "7/8 Firewall"
if command -v ufw >/dev/null && sudo ufw status | grep -q '^Status: active'; then
  sudo ufw allow "${APP_PORT}/tcp" >/dev/null && note "ufw: allowed ${APP_PORT}/tcp"
else
  note "ufw is not active: nothing to open"
fi

# ---------------------------------------------------------------- check it answers
say "Checking the site answers"
code=000
for _ in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${APP_PORT}/login" || true)"
  [ "$code" = "200" ] && break
  sleep 1
done
if [ "$code" = "200" ]; then note "the login page answers (HTTP 200)"; else
  note "the login page did not answer (last HTTP code ${code}). Look at: sudo journalctl -u ${SERVICE} -n 50 --no-pager"
fi

# ---------------------------------------------------------------- 8. first administrator
say "8/8 First administrator"
if ask_yes "Create (or reset) an administrator account now?" Y; then
  read -r -p "   Email: " admin_email
  read -r -p "   Full name: " admin_name
  echo "   Next it asks for the password twice (nothing is shown while you type; at least 8 characters)."
  npm run --silent admin:create -- --email "$admin_email" --name "$admin_name"
else
  note "later:  cd ${APP_DIR} && npm run admin:create -- --email you@company.com --name \"Full Name\""
fi

say "Done"
note "Open ${APP_URL}  and sign in with the email and password above."
note "Logs:     sudo journalctl -u ${SERVICE} -f"
note "Restart:  sudo systemctl restart ${SERVICE}"
note "Update:   run  bash $(basename "$0")  again (pulls the latest code, migrates, rebuilds, restarts)"
