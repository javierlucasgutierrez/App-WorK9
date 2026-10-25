type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string };

export function Field({ label, name, hint, ...props }: Props) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className="input" {...props} />
      {hint && <p className="muted mt-1">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  name,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <textarea id={name} name={name} rows={4} className="input" {...props} />
    </div>
  );
}

/** Elegir entre varias opciones con botones grandes (cómodo en el móvil). */
export function Choice({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: [string, string][];
  defaultValue: string;
}) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map(([value, text]) => (
          <label key={value} className="cursor-pointer">
            <input type="radio" name={name} value={value} defaultChecked={value === defaultValue} className="peer sr-only" />
            <span className="block rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-center font-medium peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200">
              {text}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
