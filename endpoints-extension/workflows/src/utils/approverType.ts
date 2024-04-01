function apprtpe(quota: number, units: number, department: number, rn: any) {
  const apprType = {
    ORDER: 'ORDER',
    MANAGER: 'MANAGER',
    DH: 'DH',
  }
  let approver = ''
  const order = 2
  if (order === 2) {
    if (Number(quota) === 0) {
      if (department > 0 && units === 0) {
        approver = apprType.DH
      }
      if (department > 0 && units > 0) {
        approver = apprType.MANAGER
      }
    } else {
      if (department === Number(quota) && units === 0) {
        approver = apprType.ORDER
      } else if (units > Number(quota)) {
        approver = apprType.MANAGER
      } else if (department > Number(quota)) {
        approver = apprType.DH
      } else if (units + department > Number(quota)) {
        approver = apprType.DH
      }
    }
  }

  return {
    units,
    department,
    rn,
    order: order,
    approver: approver,
    quota: Number(quota),
  }
}
