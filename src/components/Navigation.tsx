import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between mb-16 sm:mb-24">
      <Link to="/" className="text-2xl font-semibold tracking-tight text-gray-900 focus:outline-none active:scale-95 transition-transform duration-200 ease-out">Hola!</Link>
      <div className="hidden md:flex items-center space-x-8 text-[15px] text-gray-500">
        <Link to="/" className="hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out focus:outline-none inline-block">About</Link>
        <Link to="/" className="hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out focus:outline-none inline-block">Projects</Link>
        <Link to="/" className="hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out focus:outline-none inline-block">Blog</Link>
        <Link to="/" className="hover:text-gray-900 active:scale-95 transition-all duration-200 ease-out focus:outline-none inline-block">Feeds</Link>
      </div>
    </nav>
  );
}
