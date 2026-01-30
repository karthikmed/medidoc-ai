/**
 * Home page component for Medidoc AI
 * Displays a basic white screen with the application name
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Medidoc AI</h1>
        <p className="mt-4 text-lg text-gray-600">
          Medical Documentation Assistant
        </p>
      </div>
    </div>
  );
}
