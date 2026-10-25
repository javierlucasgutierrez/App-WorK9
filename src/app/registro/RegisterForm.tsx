"use client";

import { useState } from "react";
import { register } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { Field } from "@/components/Field";

export function RegisterForm() {
  const [role, setRole] = useState<"CLIENT" | "TRAINER">("CLIENT");

  return (
    <ActionForm action={register}>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="label">Soy…</legend>
        {(
          [
            ["CLIENT", "Particular / cliente"],
            ["TRAINER", "Profesional / adiestrador"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center font-medium ${
              role === value ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={value}
              checked={role === value}
              onChange={() => setRole(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <Field label="Nombre y apellidos" name="name" autoComplete="name" required />
      <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required />
      <Field label="Teléfono (opcional)" name="phone" type="tel" autoComplete="tel" />
      <Field label="Contraseña (mínimo 6 caracteres)" name="password" type="password" autoComplete="new-password" required minLength={6} />

      {role === "CLIENT" && (
        <>
          <Field
            label="Código de tu adiestrador (si tienes)"
            name="inviteCode"
            placeholder="Ej.: MARTA-1234"
            autoCapitalize="characters"
          />
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="mb-3 text-sm font-medium">Tu perro (opcional, puedes añadir más después)</p>
            <div className="space-y-3">
              <Field label="Nombre del perro" name="dogName" />
              <Field label="Raza" name="dogBreed" />
            </div>
          </div>
        </>
      )}

      <SubmitButton>Crear cuenta</SubmitButton>
    </ActionForm>
  );
}
