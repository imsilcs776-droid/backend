export class ImportHelper {
  public async populateArea(area: any) {
    return Object.keys(area)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Area',
            row: key.slice(1),
            code: area[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, name: area[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, description: area[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Area',
              row: key.slice(1),
              code: area[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateSector(sector: any) {
    return Object.keys(sector)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Sector',
            row: key.slice(1),
            code: sector[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, name: sector[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, description: sector[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Sector',
              row: key.slice(1),
              code: sector[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateLine(line: any) {
    return Object.keys(line)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Line',
            row: key.slice(1),
            sectorCode: line[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, code: line[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, name: line[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, description: line[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Line',
              row: key.slice(1),
              sectorCode: line[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateProcess(process: any) {
    return Object.keys(process)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Process',
            row: key.slice(1),
            sectorCode: process[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, lineCode: process[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, code: process[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, name: process[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'E'
                  ? (dt = { ...dt, description: process[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Process',
              row: key.slice(1),
              sectorCode: process[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateMachine(machine: any) {
    return Object.keys(machine)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Machine',
            row: key.slice(1),
            areaCode: machine[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, sectorCode: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, lineCode: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, processCode: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'E'
                  ? (dt = { ...dt, code: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'F'
                  ? (dt = { ...dt, name: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'G'
                  ? (dt = { ...dt, stdCycleTime: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'H'
                  ? (dt = { ...dt, maxCycleTime: machine[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'I'
                  ? (dt = { ...dt, description: machine[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Machine',
              row: key.slice(1),
              areaCode: machine[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateDepartment(department: any) {
    return Object.keys(department)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Department',
            row: key.slice(1),
            code: department[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, name: department[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, description: department[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Department',
              row: key.slice(1),
              code: department[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateJob(job: any) {
    return Object.keys(job)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Job_Title',
            row: key.slice(1),
            departmentCode: job[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, code: job[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, name: job[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, description: job[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Job_Title',
              row: key.slice(1),
              departmentCode: job[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateLevel(level: any) {
    return Object.keys(level)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'Job_Level',
            row: key.slice(1),
            departmentCode: level[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, jobCode: level[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, code: level[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, name: level[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'E'
                  ? (dt = { ...dt, description: level[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'Job_Level',
              row: key.slice(1),
              departmentCode: level[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }

  public async populateUser(user: any) {
    return Object.keys(user)
      .filter((key) =>
        (key.length == 2 && key.includes('1')) || key.includes('!')
          ? false
          : true,
      )
      .reduce((acc: any, key) => {
        if (acc.length == 0) {
          acc.push({
            sheetName: 'User',
            row: key.slice(1),
            idNumber: user[`${key}`].v,
          });
        } else {
          const [filterAcc] = acc.filter((obj: { row: string; }) => obj.row == key.slice(1));
          if (filterAcc) {
            acc = acc.map((dt: any) => {
              if (dt.row == filterAcc.row) {
                key.slice(0, 1) == 'B'
                  ? (dt = { ...dt, username: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'C'
                  ? (dt = { ...dt, email: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'D'
                  ? (dt = { ...dt, fullName: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'E'
                  ? (dt = { ...dt, gender: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'F'
                  ? (dt = { ...dt, religion: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'G'
                  ? (dt = { ...dt, address: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'H'
                  ? (dt = { ...dt, phone: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'I'
                  ? (dt = { ...dt, postCode: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'J'
                  ? (dt = { ...dt, departmentCode: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'K'
                  ? (dt = { ...dt, jobCode: user[`${key}`].v })
                  : null;
                key.slice(0, 1) == 'L'
                  ? (dt = { ...dt, levelCode: user[`${key}`].v })
                  : null;
              }
              return dt;
            });
          } else {
            acc.push({
              sheetName: 'User',
              row: key.slice(1),
              idNumber: user[`${key}`].v,
            });
          }
        }
        return acc;
      }, []);
  }
}
