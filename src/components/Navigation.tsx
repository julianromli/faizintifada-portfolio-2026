export function Navigation() {
  return (
    <nav className="flex items-center justify-between mb-16 sm:mb-24">
      <a href="#" className="text-2xl font-semibold tracking-tight text-gray-900 focus:outline-none">Hola!</a>
      <div className="hidden md:flex items-center space-x-8 text-[15px] text-gray-500">
        <a href="#" className="hover:text-gray-900 transition-colors focus:outline-none">About</a>
        <a href="#" className="hover:text-gray-900 transition-colors focus:outline-none">Projects</a>
        <a href="#" className="hover:text-gray-900 transition-colors focus:outline-none">Blog</a>
        <a href="#" className="hover:text-gray-900 transition-colors focus:outline-none">Feeds</a>
      </div>
    </nav>
  );
}
