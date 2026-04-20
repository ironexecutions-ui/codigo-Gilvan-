import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RedirectGuard() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.pathname.endsWith("/ironbusiness/perfil")) {
            navigate("/perfil", { replace: true });
        }
    }, [location.pathname, navigate]);

    return null;
}
