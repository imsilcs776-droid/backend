import { Body, Context, Endpoint, Get, Post, Req } from "@mv-data-core/decorator";
import { ApiExtensionContext } from "@mv-data-core/shared/types"
import jwt, { sign } from "jsonwebtoken";
import { nanoid } from "nanoid";
import ms from "ms";

@Endpoint("auth")
export default class DefineEndpoint {
  @Get(
    { path: "/current", tag: "Authentication" },
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
                  type: "string",
                },
              },
            },
          },
        },
      ],
    }
  )
  async getCurrentUser(@Req() req: any, @Context() ctx: ApiExtensionContext) {
    const {
      services: { ItemsService },
    } = ctx;
    const directusUsersService = new ItemsService("directus_users", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const { user: userId }: { user: string } = req.accountability;
    const user = await directusUsersService.readOne(userId, {
      fields: [
        "*",
        "role.id",
        "role.name",
        "role.code",
        "company.id",
        "company.code",
        "company.logo",
        "company.name",
        "department.id",
        "department.code",
        "department.name",
        "job.id",
        "job.code",
        "job.name",
        "level.id",
        "level.code",
        "level.name",
        "plant.*",
        "profile.*",
      ],
    });
    const privilegeService = new ItemsService("Privileges", {
      schema: req.schema,
      accountability: req.accountability,
    });
    const privileges = await privilegeService.readByQuery({
      filter: {
        user: {
          _eq: userId,
        },
      },
      fields: [
        "role.id",
        "role.code",
        "role.name",
        "role.capabilities.feature.code",
        "role.modules.module.id",
        "role.modules.module.code",
        "role.modules.module.name",
        "role.modules.module.order",
        "role.modules.module.icon",
        "role.modules.module.logo.id",
        "role.modules.module.logo.filename_disk",
        "role.modules.module.clusters.id",
        "role.modules.module.clusters.code",
        "role.modules.module.clusters.name",
        "role.modules.module.clusters.is_active",
        "role.modules.module.clusters.created_at",
        "role.modules.module.clusters.updated_at",
        "role.modules.module.clusters.module",
        "role.modules.module.clusters.order",
        "role.modules.module.clusters.pages.id",
        "role.modules.module.clusters.pages.code",
        "role.modules.module.clusters.pages.name",
        "role.modules.module.clusters.pages.description",
        "role.modules.module.clusters.pages.icon",
        "role.modules.module.clusters.pages.url",
        "role.modules.module.clusters.pages.parent",
        "role.modules.module.clusters.pages.module",
        "role.modules.module.clusters.pages.cluster",
        "role.modules.module.clusters.pages.order",
        "role.modules.module.clusters.pages.is_external_src",
        "role.modules.module.clusters.pages.childrens.id",
        "role.modules.module.clusters.pages.childrens.code",
        "role.modules.module.clusters.pages.childrens.name",
        "role.modules.module.clusters.pages.childrens.description",
        "role.modules.module.clusters.pages.childrens.icon",
        "role.modules.module.clusters.pages.childrens.url",
        "role.modules.module.clusters.pages.childrens.parent",
        "role.modules.module.clusters.pages.childrens.module",
        "role.modules.module.clusters.pages.childrens.order",
        "role.modules.module.clusters.pages.childrens.is_external_src",
        "role.modules.module.clusters.pages.childrens.childrens.id",
        "role.modules.module.clusters.pages.childrens.childrens.code",
        "role.modules.module.clusters.pages.childrens.childrens.name",
        "role.modules.module.clusters.pages.childrens.childrens.description",
        "role.modules.module.clusters.pages.childrens.childrens.icon",
        "role.modules.module.clusters.pages.childrens.childrens.url",
        "role.modules.module.clusters.pages.childrens.childrens.parent",
        "role.modules.module.clusters.pages.childrens.childrens.module",
        "role.modules.module.clusters.pages.childrens.childrens.order",
        "role.modules.module.clusters.pages.childrens.childrens.is_external_src",
        "role.modules.module.clusters.pages.childrens.childrens.childrens",
        "product.id",
        "product.code",
        "product.name",
      ],
    });
    const privilegesMapped = privileges.map((privilege: any) => {
      const capabilities = privilege?.role?.capabilities || [];

      const capabilitiesMapped = capabilities.map((capability: { feature: { code: string } }) => {
        return capability?.feature?.code || null;
      });
      privilege.role.capabilities = capabilitiesMapped;
      return privilege;
    });
    user.privileges = privilegesMapped;
    return {
      success: true,
      data: user,
    };
  }

  @Post(
    { path: "/reset-password", tag: "Authentication" },
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
                  type: "string",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          id_number: {
            type: "string",
          },
          username: {
            type: "string",
          },
        },
      },
    }
  )
  async resetPassword(@Req() req: any, @Context() ctx: any, @Body() body: any) {
    const {
      services: { ItemsService },
      env,
    } = ctx;

    const {
      ADMIN_ID,
      ADMIN_ROLE
    } = env;

    const { id_number, username } = body;
    
    const DEFAULT_PASSWORD = '123456';

    const directusUsersService = new ItemsService("directus_users", {
      schema: req.schema,
      accountability: {
        user: ADMIN_ID,
        role: ADMIN_ROLE,
        admin: true,
        app: true,
        ip: '::1',
        userAgent: 'System/1.0.0',
        share: undefined,
        share_scope: undefined,
        permissions: []
      },
    });

    if (!id_number || !username) return { success: false, message: 'Username/email and ID Number are required.', data: null };

    const filter = { email: { _eq: username }, profile: { id_number: { _eq: id_number } } };

    const users = await directusUsersService.readByQuery({ filter, fields: ["*.*"] });

    if (users.length > 0) {
      const [user] = users;
      await directusUsersService.updateOne(user.id, { password: DEFAULT_PASSWORD });
      return {
        success: true,
        message: 'Data has been updated successfully.',
        data: {
          new_password: DEFAULT_PASSWORD
        }
      };
    } else {
      return {
        success: false,
        message: 'Data not found.',
        data: null
      };
    }
  }

  @Post(
    { path: "/login-by-code", tag: "Authentication" },
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
                  type: "string",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          code: {
            type: "string",
          },
        },
      },
    }
  )
  async loginByCode(@Req() req: any, @Context() ctx: any, @Body() body: any) {
    const {
      services: { ItemsService },
      exceptions: { ServiceUnavailableException },
      env,
    } = ctx;

    try {
      const {
        ADMIN_ID,
        ADMIN_ROLE,
        SECRET,
        ACCESS_TOKEN_TTL,
      } = env;

      const { code } = body;
    
      const JWT_SECRET = 'akucintalanius';
      const accountability = {
        user: ADMIN_ID,
        role: ADMIN_ROLE,
        admin: true,
        app: true,
        ip: '::1',
        userAgent: 'System/1.0.0',
        share: undefined,
        share_scope: undefined,
        permissions: []
      };

      const directusUsersService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability,
      });

      const directusSessionService = new ItemsService("directus_sessions", {
        schema: req.schema,
        accountability,
      });

      const privilegesService = new ItemsService("privileges", {
        schema: req.schema,
        accountability,
      });

      if (!code) return { success: false, message: 'Code not found', data: null };
      let user: any;

      await jwt.verify(
        code,
        JWT_SECRET,
        async (err: any, decoded: any) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              throw "Code expired, must refresh the code.";
            }
            console.warn(err);
            throw "Code format invalid.";
          }

          if (typeof decoded.claims.user === "undefined") {
            throw "Code format invalid.";
          }

          user = await directusUsersService.readOne(decoded.claims.user, { fields: ['*', 'privileges.*'] });
        }
      );

      const token = sign(
        {
          id: user.id,
          role: user.role,
          app_access: true,
          admin_access: true,
        },
        SECRET as string,
        {
          expiresIn: ACCESS_TOKEN_TTL,
          issuer: 'directus',
        }
      );

      const refreshToken = nanoid(64);
      const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));
      
      // * Kurang Cek Privileges
      // const privileges = await privilegesService.readByQuery({
      //   filter: {
      //     user: { _eq: user.id }
      //   },
      //   fields: ["*.*"]
      // });

      // console.log(privileges);
      await directusSessionService.createOne({
        token: refreshToken,
        user: user.id,
        expires: refreshTokenExpiration,
        ip: accountability?.ip,
        user_agent: accountability?.userAgent,
      });

      await directusSessionService.deleteByQuery({
        filter: {
          expires: {
            _lt: new Date(),
          },
        },
      });

      return {
        success: true,
        message: 'Succesfully get list',
        data: {
          token,
          refresh_token: refreshToken,
        }
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      return new ServiceUnavailableException(error.message);
    }
  }

  @Post(
    { path: "/change-password", tag: "Authentication" },
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
                  type: "string",
                },
              },
            },
          },
        },
      ],
      request: {
        type: "object",
        properties: {
          old_password: {
            type: "string",
          },
          new_password: {
            type: "string",
          },
          confirm_new_password: {
            type: "string",
          },
        },
      },
    }
  )
  async changePassword(@Req() req: any, @Context() ctx: any, @Body() body: any) {
    const {
      services: { ItemsService, UsersService },
      exceptions: { ServiceUnavailableException },
    } = ctx;

    try {
      const { old_password, new_password, confirm_new_password } = body;

      if (!old_password) throw "Error old password is not provided.";
      if (!new_password) throw "Error new password is not provided.";
      if (!confirm_new_password)
        throw "Error confirm new password is not provided.";

      const directusUsersService = new ItemsService("directus_users", {
        schema: req.schema,
        accountability: req.accountability,
      });

      const service = new UsersService({
        schema: req.schema,
        accountability: req.accountability,
      });

      const { user: userId }: { user: string } = req.accountability;
      const user = await directusUsersService.readOne(userId, {
        fields: [
          "*",
          "role.id",
          "role.name",
          "role.code",
          "company.id",
          "company.code",
          "company.logo",
          "company.name",
          "department.id",
          "department.code",
          "department.name",
          "job.id",
          "job.code",
          "job.name",
          "level.id",
          "level.code",
          "level.name",
          "plant.*",
          "profile.*",
        ],
      }, {
        transformers: {
          conceal: false,
        }
      });

      const passwordIsEqual = await service.verifyHash(old_password as string, user.password);

      if (!passwordIsEqual) throw "Error old password is wrong";

      if (new_password !== confirm_new_password)
          throw "Error new password and confirm not same";

      await directusUsersService.updateOne(user.id, { password: new_password });

      return {
        success: true,
        message: 'Succesfully updated',
      };
    } catch (err) {
      const error = err as Error;
      console.warn(error);
      // return new ServiceUnavailableException(error.message);
      return { success: false, message: error };
    }
  }
}
