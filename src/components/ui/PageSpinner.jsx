/** Attente pleine page, avec une étiquette lue par les lecteurs d'écran. */
export function PageSpinner({ label = 'Chargement…' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3" role="status">
      <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default PageSpinner;
