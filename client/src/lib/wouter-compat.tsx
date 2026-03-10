import React from "react";
import {
  Link as RouterLink,
  Route as RouterRoute,
  Routes,
  useLocation as useRouterLocation,
  useNavigate,
  useParams as useRouterParams,
} from "react-router-dom";

type CompatLinkProps = Omit<React.ComponentProps<typeof RouterLink>, "to"> & {
  href: string;
};

export function Link({ href, ...props }: CompatLinkProps) {
  return <RouterLink to={href} {...props} />;
}

type SetLocation = (to: string, opts?: { replace?: boolean }) => void;

export function useLocation(): [string, SetLocation] {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const setLocation: SetLocation = (to, opts) => {
    navigate(to, { replace: Boolean(opts?.replace) });
  };
  return [`${location.pathname}${location.search}`, setLocation];
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useRouterParams() as T;
}

type CompatRouteProps = {
  path?: string;
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
};

export function Route({ path, component: Component, children }: CompatRouteProps) {
  const element = Component ? <Component /> : <>{children}</>;
  return <RouterRoute path={path || "*"} element={element} />;
}

type CompatSwitchProps = {
  children: React.ReactNode;
};

export function Switch({ children }: CompatSwitchProps) {
  return <Routes>{children}</Routes>;
}
