import { AggregationData } from './aggregationData';

export class VisualizationState {
	title: string;
	type: string;
	params: any;
	labels:string[];
	aggs: AggregationData[];
	listeners: {}
}
