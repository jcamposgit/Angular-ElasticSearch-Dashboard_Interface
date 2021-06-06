import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { PromiseObservable } from 'rxjs/observable/PromiseObservable';
import { AggregationData } from './object-classes/aggregationData';
import { VisualizationObj } from './object-classes/visualizationObj';
declare let bodybuilder: any;
@Injectable()
export class DataService {
	//Ntml API url
	url="http://localhost:30014";
	
	constructor(private http:HttpClient){
	
	}
	getTitle(): string {
		return 'Sakura - Elasticsearch Dashboard Interface';
	}
	deleteDoc(type: string, id: string): PromiseLike<any>{
		console.log('ELASTICSEARCH - SERVICE - _deleteDoc()');
		console.log('ELASTICSEARCH - SERVICE - type:', type);
		console.log('ELASTICSEARCH - SERVICE - id:', id);
		const promise= this.http.delete(this.url + "/es/delete?index=" + type + "&id=" + id).toPromise();

		return promise.then(
			response => console.log('ELASTICSEARCH - SERVICE - DELETE SUCCESS'),
			this.handleError
		);
	}
	saveDashboard(dashboardObj: any): PromiseLike<any>{
		console.log('ELASTICSEARCH - SERVICE - saveDashboard()');
		return this._isNewDocument('.sakuradashboard', dashboardObj.title).then(isNew => {
			console.log('ELASTICSEARCH - SERVICE - isNew:', isNew);
			if(isNew)
				return this._createDoc('.sakuradashboard', dashboardObj.title, dashboardObj);
			else
				return this._updateDoc('.sakuradashboard', dashboardObj.title, dashboardObj);
		});
	}
	saveVisualization(visualizationObj: VisualizationObj): PromiseLike<any>{
		console.log('ELASTICSEARCH - SERVICE - saveVisualization()');
		return this._isNewDocument('.sakuravisualization', visualizationObj.title).then(isNew => {
			console.log('ELASTICSEARCH - SERVICE - isNew:', isNew);
			if(isNew)
				return this._createDoc('.sakuravisualization', visualizationObj.title, visualizationObj);
			else
				return this._updateDoc('.sakuravisualization', visualizationObj.title, visualizationObj);
		});
	}

	request(index: string, body: any): PromiseLike<any> {
		console.log('METRICS SERVICE - request()');
		console.log('METRICS SERVICE - body:', body);
		/*let body = this._buildAggsBody(aggs);

		// If there is some bucket
		if(buckets) body = this._buildBucketsBody(buckets, body);

		console.log('ELASTICSEARCH - request() - body:', body.build());*/

		const promise= this.http.post(this.url + "/es/search?index=" + index,body.size(0).build()).toPromise();
		return promise.then(
			response => response,
			this.handleError
		);
	}

	private _createDoc(type: string, id: string, body: any): PromiseLike<any>{
		console.log('ELASTICSEARCH - SERVICE - _createDoc()');
		console.log('ELASTICSEARCH - SERVICE - type:', type);
		console.log('ELASTICSEARCH - SERVICE - id:', id);
		console.log('ELASTICSEARCH - SERVICE - body:', body);
		const promise= this.http.post(this.url + "/es/create?index=" + type + "&id=" + id,body).toPromise();
		return promise.then(
			response => console.log('ELASTICSEARCH - SERVICE - CREATE SUCCESS'),
			this.handleError
		);
	}

	private _updateDoc(type: string, id: string, doc: any): PromiseLike<any>{
		console.log('ELASTICSEARCH - SERVICE - _updateDoc()');
		console.log('ELASTICSEARCH - SERVICE - type:', type);
		console.log('ELASTICSEARCH - SERVICE - id:', id);
		console.log('ELASTICSEARCH - SERVICE - doc:', doc);
		const promise= this.http.post(this.url + "/es/update?index=" + type + "&id=" + id,{
			doc: doc
		}).toPromise();
		return promise.then(
			response => console.log('SUCCESS'),
			this.handleError
		);
	}

	private _isNewDocument(type: string, title: string): PromiseLike<boolean> {
		let body = bodybuilder().filter('term', '_id', title).build();
		const promise= this.http.post(this.url + "/es/search?index=" + type,body).toPromise();
		return promise
		.then(function(response:any){
			console.log('response:', response)
			let isNew = (response.hits.hits.length===0) ? true : false;
			return isNew;
		},
			this.handleError
		);
	}
	
	public getIndices():PromiseLike<string[]>{
		const promise= this.http.get(this.url + "/es/indices").toPromise();
		return promise.then((indexObjArray:any)=>{
			var indices = []

			console.log(indexObjArray);
			for(var i=0; i<indexObjArray.length; i++){
				console.log(indexObjArray[i].index);
				if(!indexObjArray[i].index.startsWith(".")) indices.push(indexObjArray[i].index);
			}
			console.log('indices:', indices);

			return indices;
		});
	}
	getSavedDashboards(): PromiseLike<any> {
		const promise= this.http.post(this.url + "/es/search?index=.sakuradashboard" ,{
			"query": {
				"match_all": {}
			}}).toPromise();
		return promise.then(
			(response:any) => response.hits.hits,
			this.handleError
		);
	}
	public getSavedVisualizations():PromiseLike<string[]>{

		const promise= this.http.post(this.url + "/es/search?index=.sakuravisualization" ,{
			"query": {
				"match_all": {}
			}}).toPromise();
		return promise.then(
				(response:any) => response.hits.hits,
				this.handleError
			);
		
	}

	getAllFields(index): PromiseLike<any> {
		return this.map(index).then(function(response){
			var mappings = response[index].mappings;

			// this is beacause the mapping field is different for
			// each index, so we take the first field
			var props = mappings.properties.fields? mappings.properties.fields.properties : mappings.properties;

			return props;
		});
	}

	getAggsBody(aggs: AggregationData[]): any{
		return this._getAggsBody(aggs);
	}

	private _getAggsBody(aggs: AggregationData[]): any{
		let body = bodybuilder();
		for(let i=0; i<aggs.length; i++){
			if(aggs[i].type!='count'){
					body = body.aggregation(
						this._getAggType(aggs[i]),
						null,
						aggs[i].id,
						this._getAggParams(aggs[i])
				);
			}
		}
		return body;
	}

	getAggType(agg: AggregationData): any {
		return this._getAggType(agg);
	}

	private _getAggType(agg: AggregationData): any {
		if(agg.type=='median'){
			return 'percentiles';
		}else{
			return agg.type;
		}
	}

	getAggParams(agg: AggregationData): any {
		return this._getAggParams(agg);
	}

	private _getAggParams(agg: AggregationData): any {
		if(agg.type=='top_hits'){
			let params = {
				_source: agg.params.field,
				size: agg.params.size,
				sort: []
			}
			let sort = {};
			sort[agg.params.sortField] = {
				"order": agg.params.sortOrder
			}
			params.sort.push(sort);
			return params;
		}else{
			return agg.params;
		}
	}

	private map(index): PromiseLike<any> {
		const promise= this.http.get(this.url + "/es/mappings?index=" + index ).toPromise();
		return promise
		.then(
			response => response,
			this.handleError
		);
	}

	private handleError(error: any): Promise<any> {
		console.error('An error occurred', error); // for demo purposes only
		return Promise.reject(error.message || error);
	}

}
