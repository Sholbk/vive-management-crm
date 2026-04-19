import { CONTACT_TYPES, type ContactType } from "@/app/contacts/types";

export interface ContactFormValues {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  contact_source: string | null;
  contact_type: ContactType;
  notes: string | null;
}

const TYPE_LABELS: Record<ContactType, string> = {
  lead: "Lead",
  client: "Client",
  vendor: "Vendor",
  other: "Other",
};

function inputCls() {
  return "mt-1 w-full px-3 py-2 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent";
}

export default function ContactForm({
  action,
  values,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  values?: ContactFormValues;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-text">First Name</span>
          <input
            name="first_name"
            defaultValue={values?.first_name ?? ""}
            className={inputCls()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-text">Last Name</span>
          <input
            name="last_name"
            defaultValue={values?.last_name ?? ""}
            className={inputCls()}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-text">Email</span>
          <input
            name="email"
            type="email"
            defaultValue={values?.email ?? ""}
            className={inputCls()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-text">Phone</span>
          <input
            name="phone"
            type="tel"
            defaultValue={values?.phone ?? ""}
            className={inputCls()}
          />
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium text-text">Date of Birth</span>
          <input
            name="date_of_birth"
            type="date"
            defaultValue={values?.date_of_birth ?? ""}
            className={inputCls()}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-text">Contact Type</span>
          <select
            name="contact_type"
            defaultValue={values?.contact_type ?? "lead"}
            className={inputCls()}
          >
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-text">
          Contact Source
        </span>
        <input
          name="contact_source"
          defaultValue={values?.contact_source ?? ""}
          placeholder="e.g. Loma del Mar website, referral, walk-in"
          className={inputCls()}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-text">Notes</span>
        <textarea
          name="notes"
          defaultValue={values?.notes ?? ""}
          rows={3}
          className={inputCls()}
        />
      </label>

      <button
        type="submit"
        className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
