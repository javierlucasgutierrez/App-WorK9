import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL, legalIsDraft } from "@/lib/legal";

// Páginas legales. Son BORRADORES orientativos: conviene que los revise un asesor antes de publicar.

const L = LEGAL;

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="h2 mt-6">{children}</h2>;
}

const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  normas: {
    title: "Normas de la comunidad",
    body: (
      <>
        <p>
          Canueve K9 es un punto de encuentro entre personas del perro de trabajo. Para que funcione, pedimos lo mismo que en
          cualquier club: respeto, honestidad y sentido común.
        </p>
        <H>Qué se puede publicar</H>
        <ul>
          <li>Material para perros de trabajo y deporte, nuevo o de segunda mano.</li>
          <li>Material hecho por creadores y talleres.</li>
          <li>Cursos, seminarios, sesiones y servicios relacionados (por ejemplo, figurante).</li>
        </ul>
        <H>Qué no se puede publicar</H>
        <ul>
          <li>Animales: Canueve K9 no es un sitio para vender, regalar ni cruzar perros.</li>
          <li>Material cuyo uso o venta prohíba la normativa de bienestar animal vigente (estatal o de tu comunidad autónoma).</li>
          <li>Armas, medicamentos, productos falsificados o cualquier cosa ilegal.</li>
          <li>Anuncios engañosos, repetidos o que no sean de material, cursos o servicios.</li>
        </ul>
        <H>Trato entre socios</H>
        <ul>
          <li>Describe el material con sinceridad: talla, estado, uso y defectos. Las fotos deben ser del artículo real.</li>
          <li>Responde a quien te escribe, aunque sea para decir que ya está vendido, y marca el anuncio como Reservado o Vendido.</li>
          <li>Usa los datos de contacto solo para hablar del anuncio. Nada de publicidad ni mensajes no deseados.</li>
        </ul>
        <H>Consejos de seguridad</H>
        <ul>
          <li>Mejor en mano y en un lugar público. Si hay envío, desconfía de quien pida pagos por adelantado con prisas o por métodos sin protección.</li>
          <li>Revisa bien el material de mordida y de sujeción (costuras, mosquetones, hebillas) antes de usarlo con el perro.</li>
          <li>Canueve K9 pone en contacto a los socios, pero no interviene en los pagos ni en las entregas.</li>
        </ul>
        <H>Si algo no va bien</H>
        <p>
          Usa el botón «Denunciar anuncio». Revisamos las denuncias y podemos ocultar anuncios o bloquear cuentas que no cumplan
          estas normas.
        </p>
      </>
    ),
  },
  "aviso-legal": {
    title: "Aviso legal",
    body: (
      <>
        <H>Titular de la web</H>
        <p>
          En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI),
          se informa de que esta web ({L.domain}) es de {L.owner}, con NIF {L.taxId} y domicilio en {L.address}. Contacto:{" "}
          {L.email}.
        </p>
        <H>Qué es Canueve K9</H>
        <p>
          Canueve K9 es una plataforma que permite a sus socios publicar anuncios de material, cursos y servicios relacionados
          con el perro de trabajo y ponerse en contacto entre ellos. Canueve K9 no vende ni compra los artículos anunciados, no
          interviene en los pagos ni en las entregas y no es parte de los acuerdos entre socios.
        </p>
        <H>Responsabilidad sobre los anuncios</H>
        <p>
          Cada socio es responsable de lo que publica. Canueve K9 actúa como servicio de alojamiento de datos y retirará con
          diligencia los contenidos ilícitos o contrarios a las normas de la comunidad de los que tenga conocimiento, por
          ejemplo mediante el botón «Denunciar anuncio» o escribiendo a {L.email}.
        </p>
        <H>Condiciones de uso</H>
        <p>
          Para publicar o contactar hay que crear una cuenta, ser mayor de edad, dar datos verdaderos y cumplir las{" "}
          <Link href="/legal/normas" className="link">
            normas de la comunidad
          </Link>
          . Podemos suspender cuentas que las incumplan.
        </p>
        <H>Propiedad intelectual</H>
        <p>
          El diseño, el logotipo y los textos propios de Canueve K9 pertenecen a su titular. Las fotos y textos de los anuncios
          son de quien los publica, que autoriza a Canueve K9 a mostrarlos en la web mientras el anuncio exista.
        </p>
        <H>Ley aplicable</H>
        <p>Estas condiciones se rigen por la legislación española.</p>
      </>
    ),
  },
  privacidad: {
    title: "Política de privacidad",
    body: (
      <>
        <H>Responsable</H>
        <p>
          {L.owner} (NIF {L.taxId}), {L.address}. Contacto para temas de privacidad: {L.email}.
        </p>
        <H>Qué datos tratamos y para qué</H>
        <ul>
          <li>
            <strong>Cuenta:</strong> nombre, correo, contraseña (guardada cifrada, nunca en claro), teléfono y zona si los das, y
            tu tipo de cuenta. Para gestionar tu cuenta y que puedas usar la web.
          </li>
          <li>
            <strong>Escaparate y anuncios:</strong> lo que publicas (textos, fotos, precio, zona, logo, presentación, web) es
            público para cualquier visitante.
          </li>
          <li>
            <strong>Contacto entre socios:</strong> al pulsar «Me interesa», el anunciante ve tu nombre, correo, teléfono y
            mensaje, y tú ves los suyos. Solo ocurre cuando tú lo decides.
          </li>
          <li>
            <strong>Seguridad:</strong> la dirección IP y los intentos recientes de entrada o registro, para frenar abusos. Se
            borran a las 24 horas.
          </li>
          <li>
            <strong>Correos:</strong> te escribimos para confirmar tu correo, recuperar la contraseña y avisarte cuando alguien
            se interesa por tus anuncios. No enviamos publicidad sin tu permiso.
          </li>
        </ul>
        <H>Base legal</H>
        <p>
          La ejecución del servicio que pides al registrarte (art. 6.1.b del RGPD) y nuestro interés legítimo en mantener la
          plataforma segura (art. 6.1.f).
        </p>
        <H>Con quién se comparten</H>
        <p>
          Con otros socios solo en los casos explicados arriba. Además, usamos proveedores que tratan los datos por encargo
          nuestro: alojamiento de la web, base de datos, almacenamiento de fotos, envío de correos y, si eliges entrar con
          Google, Google. Algunos pueden estar fuera del Espacio Económico Europeo. En ese caso se usan las garantías que exige
          el RGPD (por ejemplo, cláusulas contractuales tipo o el Marco de Privacidad de Datos UE-EE. UU.).
        </p>
        <H>Cuánto tiempo</H>
        <p>
          Mientras tengas la cuenta. Si la borras, se eliminan tus datos, anuncios y fotos, salvo lo que la ley obligue a
          conservar.
        </p>
        <H>Tus derechos</H>
        <p>
          Puedes acceder a tus datos, corregirlos, borrarlos, oponerte a su uso, limitarlo o pedir una copia escribiendo a{" "}
          {L.email}. Puedes corregirlos y borrar tu cuenta tú mismo desde «Mi perfil». Si crees que no hemos atendido bien tu
          petición, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
        </p>
        <H>Edad</H>
        <p>Canueve K9 es para mayores de 18 años.</p>
      </>
    ),
  },
  cookies: {
    title: "Política de cookies",
    body: (
      <>
        <p>
          Canueve K9 solo usa <strong>cookies técnicas</strong>, imprescindibles para que la web funcione. No usamos cookies de
          publicidad ni de análisis. Por eso no te pedimos permiso con un aviso (art. 22.2 de la LSSI).
        </p>
        <div className="overflow-x-auto">
          <table className="my-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-3">Cookie</th>
                <th className="py-2 pr-3">Para qué</th>
                <th className="py-2">Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-3 font-mono">canueve_session</td>
                <td className="py-2 pr-3">Mantener tu sesión iniciada</td>
                <td className="py-2">30 días</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">canueve_google_state</td>
                <td className="py-2 pr-3">Seguridad al entrar con Google</td>
                <td className="py-2">10 minutos</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Si en el futuro añadimos cookies de análisis o publicidad, pediremos tu consentimiento antes.</p>
      </>
    ),
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: PAGES[(await params).slug]?.title };
}

export default async function LegalPage({ params }: Props) {
  const page = PAGES[(await params).slug];
  if (!page) notFound();
  return (
    <article className="legal mx-auto max-w-2xl">
      {legalIsDraft() && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          ⚠️ Borrador: faltan los datos del titular (archivo <code>src/lib/legal.ts</code>) y conviene que lo revise un asesor
          antes de publicar la web.
        </p>
      )}
      <h1 className="h1">{page.title}</h1>
      <p className="muted mb-2">Última actualización: {LEGAL.updated}</p>
      <div className="space-y-3 leading-relaxed text-gray-800">{page.body}</div>
    </article>
  );
}
