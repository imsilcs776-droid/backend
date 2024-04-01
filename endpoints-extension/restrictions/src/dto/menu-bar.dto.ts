export class MenuBarBaseDTO {
  public company: number | undefined;
  public plants: number[] | undefined;
  public roles: number[] | undefined;
  public category: string | undefined;
  public sub_menus: object[] | undefined;
  public name: string | undefined;
  public icon: string | undefined;
  public menu_shown: boolean | undefined;
  public icon_shown: boolean | undefined;
  public is_badge: boolean | undefined;
  public source_badge: string | null | undefined;
  public cluster: string | null | undefined;
  public menu: string | null | undefined;
  public endpoint: string | null | undefined;
  public is_active: boolean | undefined;
  public additional: object | undefined;
  created_by: number | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  deleted_at: Date | undefined;
}

export class MenuBarRegenerateDTO {

  public company: number | undefined;
  created_by: number | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  deleted_at: Date | undefined;
}
