type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string };

export function Field({ label, name, ...props }: Props) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} className="input" {...props} />
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
