export interface QuestionDTO {
  name: string;
  table: {
    virtual_id: number;
    name: string;
    columns: [
      {
        datasource_id: number;
        database: string;
        entity: string;
        property: string;
        as: string;
        isShown: true;
      },
    ];
  };
  filters: [
    {
      datasource_id: number;
      database: string;
      entity: string;
      property: string;
      as: string;
      operator: string;
      value: string;
    },
  ];
  sorts: [
    {
      datasource_id: number;
      database: string;
      entity: string;
      property: string;
      as: string;
      order: string;
    },
  ];
  summarizes: [
    {
      datasource_id: number;
      database: string;
      entity: string;
      property: string;
      as: string;
      summary: string;
    },
  ];
  groups: [
    {
      datasource_id: number;
      database: string;
      entity: string;
      property: string;
      as: string;
    },
  ];
  limit: number;
}
