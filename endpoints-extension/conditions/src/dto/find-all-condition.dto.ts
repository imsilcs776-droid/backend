export interface FindAllConditionDto {
  businessId: number;
  activityId: number;
  type: string;
  filterBy: string;
  search: string;
  pagination: number;
  limit: number;
}