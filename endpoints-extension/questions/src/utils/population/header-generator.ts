import { Group, Sumarize } from '../query/inteface';

export class HeaderGenerator {
  public headers: {
    headerName: string;
    field: string;
    type?: string;
  }[];

  properties: any[];

  generateProperties(sources: any) {
    this.properties = sources.reduce((sourceAcc, source) => {
      const { entity, properties } = source;

      const filterProperties = properties
        .filter((pro) => pro.isShown)
        .map((pro) => ({
          field: `${entity}_${pro.name}`,
          as: pro.as,
        }));
      sourceAcc.push(...filterProperties);
      return sourceAcc;
    }, []);
  }

  addSumaries(summaries: Sumarize[] = [], includes: any[] = []) {
    if (summaries.length === 0) {
      if (includes.length > 0) {
        this.headers = includes.map((include) => ({
          headerName: include.as || include.property,
          field: include.entity + '_' + include.property,
        }));
      } else {
        this.headers = this.properties.map((property) => ({
          headerName: property.as,
          field: property.field,
        }));
      }
    }

    summaries.forEach((summary) => {
      this.headers.push({
        headerName: summary.alias || summary.as || summary.property,
        field: `summary_${summary.entity}_${summary.property}`,
      });
    });
  }

  addGroup(groups: Group[] = []) {
    groups.forEach((order) => {
      this.headers.push({
        headerName: order.alias || order.as || order.property,
        field: `group_${order.entity}_${order.property}`,
      });
    });
  }

  addDataType(datas) {
    this.headers = this.headers.map((header) => {
      const validSampleData = datas.find((data) => !!data[header.field]);

      if (validSampleData[header.field] instanceof Date) {
        header.type = 'date';
      } else {
        header.type = typeof validSampleData[header.field];
      }
      return header;
    });
  }
}
