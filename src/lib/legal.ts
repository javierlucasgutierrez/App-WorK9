// Datos del titular de la web para las páginas legales (aviso legal, privacidad...).
// ⚠️ Rellénalos antes de publicar la web. Mientras haya algo entre [corchetes],
// las páginas legales muestran un aviso de "borrador".
export const LEGAL = {
  owner: "[Nombre y apellidos o razón social]",
  taxId: "[NIF]",
  address: "[Dirección postal completa]",
  email: "[correo de contacto, p. ej. hola@canueve.es]",
  domain: "[canueve.es]",
  updated: "26 de octubre de 2026",
};

export const legalIsDraft = () => Object.values(LEGAL).some((v) => v.startsWith("["));
