import { Link } from 'react-router-dom';
import { DaImage } from '../atoms/DaImage';
import DaNavUser from '../molecules/DaNavUser';
import { TbDashboard, TbHome } from 'react-icons/tb';
import useSelfProfileQuery from '../../hooks/useSelfProfile';
import { IoIosMail } from 'react-icons/io';
import config from '../../config/config';

const NavigationBar = () => {
  const { data: user } = useSelfProfileQuery();

  return (
    <header className="da-nav-bar">
      <Link to="/">
        <DaImage src="/imgs/logo-wide.png" className="da-nav-bar-logo" />
      </Link>

      {user && (
        <nav className="ml-8 flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <TbHome className="text-xl" />
            <span>Home</span>
          </Link>
          <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <TbDashboard className="text-xl" />
            <span>Dashboard</span>
          </Link>
        </nav>
      )}

      <div className="grow"></div>

      {config && config.enableSupport && user && (
        <Link to="https://vhub.app.bosch.com">
          <div className="mr-4 flex h-full items-center font-semibold text-orange-600 hover:underline">
            <IoIosMail className="mr-1 animate-pulse" size={24} />
            Contact
          </div>
        </Link>
      )}

      <DaNavUser />
    </header>
  );
};

export { NavigationBar };
export default NavigationBar;
