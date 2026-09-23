"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook, faCalendarPlus, faChalkboardUser, faBars, faTimes, faUserGear } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const AdminNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);

  const { t } = useTranslation();
  const menuItems = [
    { icon: faBook, label: t("admin_subjects"), href: "/admin/subjects" },
    { icon: faCalendarPlus, label: t("admin_semesters"), href: "/admin/semesters" },
    { icon: faChalkboardUser, label: t("admin_schedule"), href: "/admin/schedule" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex flex-row gap-2 justify-evenly bg-primary text-primary-foreground p-7 rounded-xl my-5 text-xl">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="group flex flex-row items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 hover:bg-card hover:text-card-foreground hover:scale-105 hover:shadow-lg">
              <FontAwesomeIcon icon={item.icon} className="transition-transform duration-300 group-hover:rotate-12" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden bg-primary text-primary-foreground rounded-xl my-5">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <FontAwesomeIcon icon={faUserGear} className="text-xl" />
            {t("admin_portal")}
          </div>
          <button
            onClick={toggleMenu}
            className="p-2 rounded-lg hover:bg-card hover:text-card-foreground transition-colors duration-300"
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="text-xl transition-transform duration-300" />
          </button>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="px-4 pb-4 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="group flex flex-row items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-300 hover:bg-card hover:text-card-foreground">
                  <FontAwesomeIcon icon={item.icon} className="transition-transform duration-300 group-hover:rotate-12" />
                  <span className="text-lg">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default AdminNavbar;
