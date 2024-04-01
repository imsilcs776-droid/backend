export interface Column {
	property: string;
	isShown: any;
	as: string;
	isSource: boolean;
}

export interface Table {
	questionId: string;
	name: string;
	columns: Column[];
}

export interface Summarize {
	property: string;
	summary: string;
	as: string;
	alias: string;
}

export interface Group {
	property: string;
	as: string;
}

export interface Filter {
	property: string;
	operator: string;
	value: string;
	as: string;
}

export interface Sort {
	property: string;
	order: string;
}

export interface Insight {
	table?: Table;
	summarizes?: Summarize[];
	groups?: Group[];
	filters?: Filter[];
	limit?: number;
	sorts?: Sort[];
}