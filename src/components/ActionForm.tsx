"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";

export type FormState = { error?: string; ok?: string } | undefined;
type Action = (state: FormState, form: FormData) => Promise<FormState>;

const PendingContext = createContext(false);

/**
 * Formulario que llama a una acción del servidor y muestra el mensaje de error o de éxito.
 * Los campos se conservan si hay un error; con resetOnSuccess se vacían cuando todo va bien.
 */
export function ActionForm({
  action,
  children,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        // Enviamos a mano para que React no vacíe el formulario si hay un error.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {state.ok}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, className = "btn w-full" }: { children: React.ReactNode; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Guardando…" : children}
    </button>
  );
}
