import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Inicio',
  },
  {
    displayName: 'Dashboard',
    iconName: 'solar:atom-line-duotone',
    route: '/dashboard',
  },
  {
    displayName: 'Reportes',
    iconName: 'solar:chart-square-line-duotone',
    route: '/dashboard/reports',
  },
  {
    displayName: 'Seguimiento',
    iconName: 'solar:chart-square-line-duotone',
    route: '/tracking',
  },
  {
    navCap: 'Gestión',
  },
  {
    displayName: 'Anotaciones',
    iconName: 'solar:notes-line-duotone',
    route: '/annotations',
  },
  {
    displayName: 'Categorías',
    iconName: 'solar:tag-line-duotone',
    route: '/dashboard/category',
  },
  {
    displayName: 'Ciudadanos',
    iconName: 'solar:user-line-duotone',
    route: '/dashboard/citizen',
  },
  {
    displayName: 'Ciudades',
    iconName: 'solar:city-line-duotone',
    route: '/dashboard/city',
  },
  {
    displayName: 'Comunas',
    iconName: 'solar:map-point-line-duotone',
    route: '/dashboard/commune',
  },
  {
    displayName: 'Departamentos',
    iconName: 'solar:buildings-line-duotone',
    route: '/dashboard/department',
  },
  {
    displayName: 'Entidades',
    iconName: 'solar:case-round-line-duotone',
    route: '/dashboard/entity',
  },
  {
    displayName: 'Barrios',
    iconName: 'solar:home-smile-line-duotone',
    route: '/dashboard/neighborhood',
  },
  {
    displayName: 'Funcionarios',
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
    displayName: 'Demarcación Mapa',
    iconName: 'solar:map-line-duotone',
    route: '/territorial/mapa',
  },
];
