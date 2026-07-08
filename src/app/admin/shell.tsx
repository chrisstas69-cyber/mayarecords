import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/releases";
import { AdminNav } from "@/components/admin/AdminNav";

/**
 * Server shell for /admin: renders the setup screen when Supabase isn't
 * configured, the bare page for /admin/login, and the navigation chrome
 * for everything else. Route protection itself happens in middleware.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    // Only /admin/login reaches here unauthenticated (middleware redirects the rest);
    // the login page renders its own full-screen layout.
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-night">
      <AdminNav email={user.email ?? "signed in"} onSignOut={signOut} />
      <main className="px-4 pb-28 pt-20 lg:ml-60 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5">
      <div className="max-w-xl border border-line bg-surface p-8 sm:p-10">
        <p className="eyebrow mb-4">Label Portal</p>
        <h1 className="display-md mb-5 text-cream">Connect Supabase to open the portal</h1>
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-sand">
          <li>Create a project at <span className="text-gold">supabase.com</span>.</li>
          <li>
            Run <code className="bg-night px-1.5 py-0.5 text-gold">supabase/migrations/0001_init.sql</code> in the SQL
            editor (and optionally <code className="bg-night px-1.5 py-0.5 text-gold">supabase/seed.sql</code>).
          </li>
          <li>
            Copy <code className="bg-night px-1.5 py-0.5 text-gold">.env.example</code> to{" "}
            <code className="bg-night px-1.5 py-0.5 text-gold">.env.local</code> and fill in the project URL and anon
            key.
          </li>
          <li>Restart the dev server, sign up at /admin/login, then promote your user to admin (see README).</li>
        </ol>
        <p className="mt-6 text-xs text-stone">
          The public site keeps working without Supabase — it serves the built-in seed catalog until the database takes
          over.
        </p>
      </div>
    </div>
  );
}
