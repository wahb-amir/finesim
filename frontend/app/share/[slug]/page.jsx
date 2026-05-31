import ShareLanding from "./ShareLanding";

const API = process.env.NEXT_PUBLIC_API_URL;

async function loadShare(slug) {
  try {
    const res = await fetch(`${API}/share/${slug}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    if (!res.ok || !data?.success) return null;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await loadShare(slug);
  if (!data?.card) {
    return {
      title: "FinSim Share",
      description: "Financial life simulation results on FinSim.",
    };
  }

  const { card } = data;
  const nw = card.netWorth ?? 0;
  const sign = nw >= 0 ? "+" : "";
  const title = `${card.playerName}'s FinSim — ${sign}$${nw.toLocaleString()} net worth`;
  const description =
    card.verdict ||
    card.shareText ||
    "See how 10 years of financial decisions played out.";

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_CLIENT_URL ||
    "http://localhost:3000";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${site.replace(/\/$/, "")}/share/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SharePage({ params }) {
  const { slug } = await params;
  const data = await loadShare(slug);

  if (!data?.card) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-[#F5F5F5] text-lg font-semibold mb-2">
            Share card not found
          </p>
          <p className="text-[#6B6B6B] text-sm mb-6">
            This link may have expired or the run was removed.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: "#F59E0B", color: "#0A0A0A" }}
          >
            Go to FinSim
          </a>
        </div>
      </div>
    );
  }

  return <ShareLanding card={data.card} url={data.url} />;
}
