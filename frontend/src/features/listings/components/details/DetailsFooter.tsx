export default function DetailsFooter() {
  return (
    <footer className="bg-[#E8E4DC] px-8 py-16">
      <div className="mx-auto grid max-w-[90rem] gap-12 md:grid-cols-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#252423]">Eventvnv</h2>
          <p className="mt-5 text-sm leading-6 text-[#5E6588]">
            Curating Africa&apos;s most prestigious event spaces and creative talents for extraordinary experiences.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#B9401D]">Discovery</h3>
          <p className="mt-5 text-sm text-[#5E6588]">Browse Venues</p>
          <p className="mt-3 text-sm text-[#5E6588]">Journal</p>
          <p className="mt-3 text-sm text-[#5E6588]">Instagram</p>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#B9401D]">Support</h3>
          <p className="mt-5 text-sm text-[#5E6588]">Contact Support</p>
          <p className="mt-3 text-sm text-[#5E6588]">Terms of Service</p>
          <p className="mt-3 text-sm text-[#5E6588]">Privacy Policy</p>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#B9401D]">Newsletter</h3>
          <p className="mt-5 text-sm text-[#5E6588]">Subscribe for curated venue alerts.</p>
          <div className="mt-5 flex rounded-full bg-[#DCD7CE] p-1">
            <input placeholder="Email address" className="min-w-0 flex-1 bg-transparent px-4 text-sm focus:outline-none" />
            <button type="button" className="rounded-full bg-[#B9401D] px-5 text-sm font-extrabold text-white">
              Join
            </button>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-14 max-w-[90rem] border-t border-[#D8D1C7] pt-8 text-xs font-semibold text-[#7B7E9B]">
        © 2024 Eventvnv. Designed for Nigerian Excellence.
      </p>
    </footer>
  );
}
