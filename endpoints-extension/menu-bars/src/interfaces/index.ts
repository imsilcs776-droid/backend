export interface RegenerateMenuBarDTO {
    companyId: number;
}

export interface MenuBarBaseDTO {
    company: number;
    plants: number[];
    roles: number[];
    category: string,
    sub_menus: object[];
    name: string;
    icon: string;
    menu_shown: boolean;
    icon_shown: boolean;
    is_badge: boolean;
    source_badge: string;
    cluster: string;
    menu: string;
    endpoint: string;
    is_active: boolean;
    additional: object;
}