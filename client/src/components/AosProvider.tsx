import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AOS from "aos";

export default function AosProvider() {
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      delay: 40,
    });
  }, []);

  useEffect(() => {
    AOS.refreshHard();
  }, [location.pathname]);

  return null;
}
