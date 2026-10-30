import { startTransition, type FormEvent } from "react";

/**
 * Submit handler for forms whose fields are controlled by React state.
 *
 * React 19 resets a form after `<form action={fn}>` completes, which puts controlled <select> and <textarea>
 * elements back to their initial DOM value while the React state keeps the user's choice. Calling the action
 * from onSubmit inside a transition keeps the same pending/state handling from useActionState without the reset.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
