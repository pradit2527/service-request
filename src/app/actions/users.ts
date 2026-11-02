"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { Translate } from "@/lib/i18n";
import { getI18n } from "@/lib/i18n-server";
import { departmentField, phoneField } from "@/lib/user-fields";

// Role changes and user management live in admin-users.ts; this file is the signed-in user's own profile.

function profileSchema(t: Translate) {
  return z.object({ department: departmentField(t), phone: phoneField(t) });
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { t } = await getI18n();
  const user = await requireUser();

  const parsed = profileSchema(t).safeParse({
    department: formData.get("department") ?? "",
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }

  await db.user.update({
    where: { id: user.id },
    data: { department: parsed.data.department || null, phone: parsed.data.phone || null },
  });

  revalidatePath("/profile");
  return { ok: true };
}
