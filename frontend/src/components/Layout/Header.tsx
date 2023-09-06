import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom'
import { AiFillHome, AiOutlineMenu } from 'react-icons/ai';
import { IoGameController } from 'react-icons/io5';
import { GiPingPongBat } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";

function Header() {
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(isMenuOpen == false);
  };

  return (
    <>
      <header className="bg-secondary shadow-lg">
        <nav className="w-full flex flex-wrap items-center justify-between px-6 py-3">
      
          <div className="flex items-center">
            <GiPingPongBat className="w-7 h-7 mr-2.5"/>
            <Link to={'/'} className="text-lg font-medium">ft_transcendence</Link>
          </div>

          <button className="hover:text-white md:hidden"onClick={toggleMenu}>
            <AiOutlineMenu className="w-6 h-6"/>
          </button>

          <ul className={`${!isMenuOpen ? "hidden" : "flex flex-col w-full py-3 gap-2"} uppercase font-medium items-center md:flex md:flex-row md:w-max md:py-0 md:gap-4`}>
            <li className={`${pathname === "/" ? "text-tertiary" : ""} flex items-center`}>
              <AiFillHome className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/'} className="hover:text-tertiary ">Home</Link>
            </li>

            <li className={`text- ${pathname === "/game" ? "text-tertiary" : ""} flex items-center`}>
              <IoGameController className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/game'} className="hover:text-tertiary">Game</Link>
            </li>

            <li className={`${pathname === "/leaderboard" ? "text-tertiary" : ""} flex items-center`}>
              <MdLeaderboard className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/leaderboard'} className="hover:text-tertiary">Leaderboard</Link>
            </li>

            <li className="text-white mt-1 md:mt-0">
              <Link to={'/login'}>
                <button className="uppercase rounded-md bg-quaternary hover:bg-tertiary px-2.5 py-1.5">Sign in</button>
              </Link>
            </li>
          </ul>

        </nav>
      </header>
    </>
  )
}

export default Header
