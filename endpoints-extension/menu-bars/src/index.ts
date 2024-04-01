import { Body, Context, Endpoint, Get, Param, Patch, Post, Req, Res } from "@mv-data-core/decorator";
import { MenuBarBaseDTO, RegenerateMenuBarDTO } from "./interfaces";
import { topMenus } from "./seeders";

@Endpoint('menu-bars')
export default class DefineEndpoint {
  @Post(
    { path: "/re-generate", tag: "Menu Bar" },
    {
      responses: [
        {
          200: {
            description: "Description",
            responseType: "object",
            schema: {
              type: "object",
              properties: {
                msg: {
                  type: "string"
                }
              }
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          companyId: {
            type: "number",
          }
        },
      },
    },
  )
  async regenerate(@Req() req: any, @Context() ctx: any, @Body() body: RegenerateMenuBarDTO) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
    } = ctx;
    try {
      const { user: userId } = req.accountability;
      const { companyId } = body;
  
      if (companyId) {
        const menuBarService = new ItemsService("menu_bars", {
          schema: req.schema,
          accountability: req.accountability,
        });
  
        const menuBarDatas = await menuBarService.readByQuery({ filter: { company: { _eq: companyId } }, fields: ["*"] });
  
        const menuBars: any[] = [];
  
        topMenus.map((item) => {
          const [menuBar] = menuBarDatas.filter((dt: any) => dt.category == item.category && dt.additional && item.additional && dt.additional.code == item.additional.code);
          
          if (!menuBar) {
            menuBars.push({
              company: +companyId,
              plants: item.plants,
              roles: item.roles,
              category: item.category,
              sub_menus: item.subMenus,
              name: item.name,
              icon: item.icon,
              menu_shown: item.menuShown,
              icon_shown: item.iconShown,
              is_badge: item.isBadge,
              source_badge: item.sourceBadge,
              cluster: item.clusterId,
              menu: item.menuId,
              endpoint: item.endpoint,
              is_active: item.isActive,
              additional: item.additional,
            });
          }
        });
  
        if (menuBars.length > 0) await menuBarService.createMany(menuBars);
  
        return {
          success: true,
          message: "Data has been processing.",
          data: null,
        }
      } else {
        return {
          success: false,
          message: 'Data not found.',
          data: null,
        };
      }
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      return new ServiceUnavailableException(error.message);
    }
  }
}
