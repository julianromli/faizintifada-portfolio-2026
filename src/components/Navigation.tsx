import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between mb-16 sm:mb-24">
      <Link to="/" className="text-2xl font-semibold tracking-tight text-gray-900 focus:outline-none">Hola!</Link>
      <div className="hidden md:flex items-center space-x-8 text-[15px] text-gray-500">
        <Link to="/" className="hover:text-gray-900 transition-colors focus:outline-none">About</Link>
        <Link to="/" className="hover:text-gray-900 transition-colors focus:outline-none">Projects</Link>
        <Link to="/" className="hover:text-gray-900 transition-colors focus:outline-none">Blog</Link>
        <Link to="/" className="hover:text-gray-900 transition-colors focus:outline-none">Feeds</Link>
      </div>
    </nav>
  );
}
