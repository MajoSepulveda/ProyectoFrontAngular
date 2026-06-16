import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },
  {
    displayName: 'Reports',
    iconName: 'solar:chart-square-line-duotone',
    route: '/dashboard/reports',
  },

  {
    navCap: 'Gestión',
  },
  {
    displayName: 'Annotations',
    iconName: 'solar:notes-line-duotone',
    route: '/dashboard/annotations',
  },
  {
    displayName: 'Category',
    iconName: 'solar:tag-line-duotone',
    route: '/dashboard/category',
  },
  {
    displayName: 'Citizen',
    iconName: 'solar:user-line-duotone',
    route: '/dashboard/citizen',
  },
  {
    displayName: 'City',
    iconName: 'solar:city-line-duotone',
    route: '/dashboard/city',
  },
  {
    displayName: 'Commune',
    iconName: 'solar:map-point-line-duotone',
    route: '/dashboard/commune',
  },
  {
    displayName: 'Department',
    iconName: 'solar:buildings-line-duotone',
    route: '/dashboard/department',
  },
  {
    displayName: 'Entity',
    iconName: 'solar:case-round-line-duotone',
    route: '/dashboard/entity',
  },
  {
    displayName: 'Neighborhood',
    iconName: 'solar:home-smile-line-duotone',
    route: '/dashboard/neighborhood',
  },
  {
    displayName: 'Official',
    iconName: 'solar:user-id-line-duotone',
    route: '/dashboard/official',
  },
  {
    navCap: 'Territorial',
  },
  {
    displayName: 'Comunas',
    iconName: 'solar:city-line-duotone',
    route: '/territorial/comunas',
  },
  {
    displayName: 'Barrios',
    iconName: 'solar:map-point-wave-line-duotone',
    route: '/territorial/barrios',
  },
  {
    displayName: 'Mapa',
    iconName: 'solar:map-line-duotone',
    route: '/territorial/mapa',
  },
];
