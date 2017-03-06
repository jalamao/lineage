import * as events from 'phovea_core/src/event';
import {AppConstants, ChangeTypes} from './app_constants';
// import * as d3 from 'd3';
import {Config} from './config';

import {select, selectAll, mouse, event} from 'd3-selection';
import {format} from 'd3-format';
import {scaleLinear} from 'd3-scale';
import {max, min} from 'd3-array';
import {entries} from 'd3-collection';
import {axisTop} from 'd3-axis';
import * as range from 'phovea_core/src/range';

/**
 * Creates the attribute table view
 */
class attributeTable {

  private $node;

  private width;
  private height;

  private tableAxis;


  //private margin = {top: 60, right: 20, bottom: 60, left: 40};

  private activeView;
  private colData;    // <- everything we need to bind

  private margin = Config.margin;

  constructor(parent: Element) {
    this.$node = select(parent)
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<FilterBar>}
   */
  async init(data) {


    console.log("IN TABLE VIEW");


    this.activeView = data.activeView;


    let colDataAccum = [];
    for (const vector of this.activeView.cols()) {
      const temp = await vector.data(range.all());
      const type = await vector.valuetype.type;
      if(type === 'categorical'){
        const categories = Array.from(new Set(temp));
        for(const cat of categories){
          var col: any = {};
          const base_name = await vector.column;
          col.name = base_name + '_' + cat;
          col.data = temp.map(
            (d)=>{if(d === cat) return d;
                  else return undefined;});
          col.ys = data.ys;
          col.type = type;
          colDataAccum.push(col);
        }
      }
      else{
        var col: any = {};
        col.name = await vector.column;
        col.data = temp;
        col.ys = data.ys;
        col.type = type;
        colDataAccum.push(col);
      }
    }


    this.colData = colDataAccum;
    console.log("this is colData:");
    console.log(colDataAccum);

    this.build();
    this.attachListener();

    console.log("LEAVING TABLE VIEW");

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }


  /**
   * Build the basic DOM elements and binds the change function
   */
  private async build() {

    this.width = 450 - this.margin.left - this.margin.right
    // this.height = Config.glyphSize * 3 * this.activeView.nrow - this.margin.top - this.margin.bottom;
    this.height = 2504;

    const darkGrey = '#4d4d4d';
    const lightGrey = '#d9d9d9';
    const mediumGrey = '#bfbfbf';
    const lightPinkGrey = '#eae1e1';
    const darkBlueGrey = '#4b6068';


    //rendering info
    var col_widths = this.getDisplayedColumnWidths(this.width);
    var col_xs = this.getDisplayedColumnXs(this.width);
    var label_xs = this.getDisplayedColumnMidpointXs(this.width);


    // Scales
    let x = scaleLinear().range([0, this.width]).domain([0, 13]);
    let y = scaleLinear().range([0, this.height]).domain([1, 98]); // TODO
    // [min(rowData,
    //   function(d){return +d['y']}), max(rowData,function(d){return +d['y']}) ]);

    const rowHeight = Config.glyphSize * 2.5 - 4;

    const svg = this.$node.append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)


//HEADERS
    const tableHeader = svg.append("g")
      .attr("transform", "translate(0," + this.margin.top / 2 + ")");

    //Bind data to the col headers
    let headers = tableHeader.selectAll(".header")
      .data(this.colData.map((d,i) => {return {'name':d.name, 'data':d, 'ind':i, 'type':d.type}}));

    const headerEnter = headers
      .enter()
      .append('text')
      .classed('header', 'true')
    //.attr("transform", (d) => {return 'translate(' + x(d['ind']) + ',0) rotate(-45)';});
    .attr("transform",(d) => {
      const x_translation = label_xs.find(x => x.name === d.name).x;
      return 'translate(' + x_translation + ',0) rotate(-45)';});



    selectAll('.header')
      .text((d) => {return d['name']})


// TABLE
    const table = svg.append("g")
      .attr("transform", "translate(0," + this.margin.top + ")");

    //Bind data to the col groups
    let cols = table.selectAll(".column")
      .data(this.colData.map((d,i) => {return {'name':d.name, 'data':d.data, 'ind':i, 'ys':d.ys, 'type':d.type}}));

    const colsEnter = cols.enter()
      .append('g')
      .classed('dataCols', true)
      .attr("transform", (d) => {
        const x_translation = col_xs.find(x => x.name === d.name).x;
        return 'translate(' + x_translation + ',0)';});


    cols = colsEnter.merge(cols);

    //Bind data to the cells
    let cells = cols.selectAll('.cell')
      .data((d) => {
        return d.data.map((e, i) => {
          return {'name': d.name, 'data': e, 'y': d.ys[i], 'type':d.type} //, 'ind':i}
        })
      })
      .enter()
      .append("g")
      .attr('class', 'cell');


      const categoricals = cells.filter((e)=>{return (e.type === 'categorical')})
                            .attr('classed', 'categorical');
      const quantatives  = cells.filter((e)=>{return (e.type === 'int')})
                            .attr('classed', 'quantitative');
      const idCells      = cells.filter((e)=>{return (e.type === 'idtype')})
                            .attr('classed', 'idtype');


    //  for (const category ) {

      categoricals
      .append('rect')
      .attr('width', (d)=> {return col_widths.find(x => x.name === d.name).width;})
      .attr('height', 20)
      .attr('stroke', 'black')
      .attr('stoke-width', 1)
      .attr('fill', 'blue');







      quantatives
      .append('rect')
      .attr('width', (d)=> {return col_widths.find(x => x.name === d.name).width;})
      .attr('height', 20)
      .attr('stroke', 'black')
      .attr('stoke-width', 1)
      .attr('fill', 'red');










    //Move cells to their correct y position
    selectAll('.cell')
      .attr("transform", function (col) {
        return ('translate(0, ' + y(col['y']) + ' )'); //the x translation is taken care of by the group this cell is nested in.
      });


    // for (const name of this.colData.names) {
    //   cols.classed(name, function(col){
    //     return col.name === name;
    //   });
    // }


    // let rows = table.selectAll(".row")
    // .data(rowData) // TODO: aggregation
    // .enter()
    // .append("g")
    // .attr('id', function (elem) {
    //   return ('row_' +  elem.id);
    // })
    // .attr('class', 'row')
    // .attr("transform", function (elem) {
    //   // console.log("this was the element: ");
    //   // console.log(elem);
    //   // console.log("this was the y position: " + elem.y);
    //   return ('translate(0, ' +  y(elem.y)+ ' )');
    // });
    //
    //
    //
    //
    //
    //
    //
    //
    // //////////////////////
    // // monster for loop creates all vis. encodings for rows
    //     const col_margin = 4;
    //     for (let colIndex = 0; colIndex < num_cols; colIndex++) {
    //       const curr_col_name = displayedColNames[colIndex];
    //       const curr_col_type = displayedColTypes[colIndex];
    //       const curr_col_width = col_widths[colIndex] - col_margin;
    //
    //       if( curr_col_type == 'idtype' ){
    //
    //         rows.append("rect")
    //         .attr("width", curr_col_width)
    //         .attr("height", rowHeight)
    //         .attr('fill', 'lightgrey')
    //         .attr('stroke', 'black')
    //         .attr('stoke-width', 1)
    //         .attr("transform", function () {
    //           return ('translate(' + col_xs[colIndex] + ' ,0)')
    //         });
    //
    //         rows.append("text")
    //         .text(function(elem) {
    //           const the_text = elem[curr_col_name];
    //           return the_text.toString().substring(0, 3); })
    //         .attr("transform", function (row_index) {
    //           return ('translate(' + (label_xs[colIndex] - 10) + ' ,' + (rowHeight/2 + 5) + ')')
    //         });
    //       }
    //
    //       else if( curr_col_type == 'categorical'){
    //         const allValues = rowData.map(function(elem){return elem[curr_col_name]});
    //         const uniqueValues = Array.from(new Set(allValues));
    //
    //
    //         uniqueValues.forEach(function(value) {
    //           rows.append("rect")
    //           .attr("width", curr_col_width)
    //           .attr("height", rowHeight)
    //           .attr('fill', function(elem){
    //             return (elem[curr_col_name] === uniqueValues[0]) ? '#666666' : 'white';
    //           })
    //           .attr('stroke', 'black')
    //           .attr('stoke-width', 1)
    //           .attr("transform", function () {
    //             return ('translate(' + col_xs[colIndex] + ' ,0)')
    //           });
    //       });
    //       }

    // else if( curr_col_type == 'int' ){
    //   // how big is the range?
    //   //find min, find max
    //   const allValues = rowData.map(function(elem){return elem[curr_col_name]}).filter(function(x){return x.length != 0;});
    //
    //   // complicated min/max to avoid unspecified (zero) entries
    //   // const min = [].reduce.call(allValues, function(acc, x) {
    //   //   //console.log("in min, x is: " + x +", x.length is: " + x.length);
    //   //   return x.length == 0 ? acc : Math.min(x, acc); });
    //   const min = Math.min( ...allValues );
    //   const max = Math.max( ...allValues );
    //   const avg = allValues.reduce(function(acc, x) {
    //     return parseInt(acc) + parseInt(x);}) / (allValues.length);
    //
    //   // only rows that have data
    //   rows.filter((elem)=>{return elem[curr_col_name].toString().length > 0;})
    //
    //
    //   const radius = 2;
    //   const scaledRange = (curr_col_width-2*radius) / (max - min);
    //
    //   rows.append("ellipse")
    //   .attr("cx", function(elem){
    //     return Math.floor((elem[curr_col_name]-min) * scaledRange);})
    //   .attr("cy", rowHeight / 2)
    //   .attr("rx", radius)
    //   .attr("ry", radius)
    //   .attr('stroke', 'black')
    //   .attr('stroke-width', 1)
    //   .attr('fill', '#d9d9d9')
    //   .attr("transform", function () { //yikes these shifts!
    //     return ('translate(' + (col_xs[colIndex]+radius) + ' ,0)');
    //   });
    //
    //   // and a boundary
    //   rows.append("rect")
    //   .attr("width", curr_col_width)
    //   .attr("height", rowHeight)
    //   .attr('fill', 'transparent')
    //   .attr('stroke', 'black')
    //   .attr('stoke-width', 1)
    //   .attr("transform", function () {
    //     return ('translate(' + col_xs[colIndex] + ' ,0)');
    //   });
    //   // stick on the median
    //   rows.append("rect") //sneaky line is a rectangle
    //   .attr("width", 2)
    //   .attr("height", rowHeight)
    //   .attr("fill", 'black')
    //   .attr("transform", function () {
    //     return ('translate(' + (Math.floor((avg-min) * scaledRange)
    //     + col_xs[colIndex] - col_margin) + ',0)');
    //   });
    // }
    // else
    //   console.log("oh no, what type is this: " + curr_col_type );

  }

  // end for loop


  /*
   let tableAxis = axisTop(x).tickFormat(format("d"));
   const rowHeight = Config.glyphSize * 2.5 - 4;
   const svg = this.$node.append('svg')
   .attr('width', this.width + this.margin.left + this.margin.right)
   .attr("height", this.height + this.margin.top + this.margin.bottom)
   const axis = svg.append("g")
   .attr("transform", "translate(" + this.margin.left + "," + this.margin.axisTop / 1.5 + ")")
   .attr('id', 'axis')
   const TEMP_LEFT_FIX = 35; //TODO: what's going on here?
   // todo: refactor so each column *knows* these things about itself
   var col_widths = this.getDisplayedColumnWidths(this.width);
   var col_xs = this.getDisplayedColumnXs(this.width);
   var label_xs = this.getDisplayedColumnMidpointXs(this.width);
   var num_cols = this.getNumberDisplayedColumns();
   var displayedColNames = this.getDisplayedColumnNames();
   var displayedColTypes = this.getDisplayedColumnTypes();
   //  var displayedColOrder = this.all_data.getDisplayedColumnOrder();
   let colNames = await this.activeView.cols().map(function(col){
   return col.desc.name;
   });
   console.log("colNames: ");
   console.log(colNames);
   // this.colData
   // ^^ UPDATE THOSE ON EVENTS- IS THIS A BAD DESIGN?
   const table_header = axis.selectAll(".table_header")
   .data(colNames)
   .enter();
   table_header.append("text")
   .text(["a", "b"])//function(colName) { return colName;})
   .attr('fill', 'black')
   .attr('class', 'b')
   .attr("transform", function (name, index) { // the 5 is to bump slight left
   //return "translate(" + (label_xs[index] - 5 - TEMP_LEFT_FIX) + ", 0) rotate(-45)";
   return "translate(" + (index*10 - 5 - TEMP_LEFT_FIX) + ", 0) rotate(-45)";
   });
   */


//  throw "I got this";

  /*
   const loremIpsum = ["", "", "", "M", "T", "T", "   ...", "   ..."];
   table_header.append("text")
   // did someone say stand in text?
   .text(function(index) { return loremIpsum[index]; })
   .attr('fill', 'black')
   .attr("transform", function (index) {
   return "translate(" + (col_xs[index] - TEMP_LEFT_FIX) + ", 20)";
   });
   const wholeWidth = this.width; //binding here bc "this" mess
   axis.append("rect")
   .attr('width', wholeWidth)
   .attr('height', 1)
   .attr('fill', 'black')
   .attr("transform", function (index) { //TODO: what's up with the shift?
   return "translate(" + (-1*TEMP_LEFT_FIX - 5) + ", 5)";
   })
   // TODO: to sort the table by attribute
   table_header.append("rect")
   .attr('width', function(index){ return col_widths[index];})
   .attr('height', 40)
   .attr('fill', 'transparent')
   .attr("transform", function (index) { //TODO: what's up with the shift?
   return "translate(" + (col_xs[index] - TEMP_LEFT_FIX - 5) + ", 0)";
   })
   // CLICK
   .on('click', function(d) {
   //1. sort attributes, keep a hold of some row id - add row DS
   //2. update row display order
   })
   */
/// ^ columns
  /*
   /// v row
   const table = svg.append("g")
   .attr("transform", "translate(0," + this.margin.top + ")")
   let rows = table.selectAll(".row")
   .data(await this.activeView.objects("(0:-1)"))
   .enter();
   // .attr('id', function (elem) {
   //   return ('row_' +  elem.id);
   // })
   //.attr('class', 'row');
   // .attr("transform", function (elem) {
   //   return ('translate(0, ' +  y(elem.y)+ ' )');
   // });
   rows.append("rect")
   .attr("width", 30)
   .attr("height", rowHeight)
   .attr('fill', 'lightgrey')
   .attr('stroke', 'black')
   .attr('stoke-width', 1);
   */

  /*
   let rows = table.selectAll(".row")
   .data(betterData) // TODO: aggregation
   .enter()
   .append("g")
   .attr('id', function (elem) {
   return ('row_' +  elem.id);
   })
   .attr('class', 'row')
   .attr("transform", function (elem) {
   return ('translate(0, ' +  y(elem.y)+ ' )');
   });
   //////////////////////
   // monster for loop creates all vis. encodings for rows
   const col_margin = 4;
   for (let colIndex = 0; colIndex < num_cols; colIndex++) {
   const curr_col_name = displayedColNames[colIndex];
   const curr_col_type = displayedColTypes[colIndex];
   const curr_col_width = col_widths[colIndex] - col_margin;
   if( curr_col_type == 'idType' ){
   rows.append("rect")
   .attr("width", curr_col_width)
   .attr("height", rowHeight)
   .attr('fill', 'lightgrey')
   .attr('stroke', 'black')
   .attr('stoke-width', 1)
   .attr("transform", function () {
   return ('translate(' + col_xs[colIndex] + ' ,0)')
   });
   rows.append("text")
   .text(function(elem) {
   const the_text = elem[curr_col_name];
   return the_text.toString().substring(0, 3); })
   .attr("transform", function (row_index) {
   return ('translate(' + (label_xs[colIndex] - 10) + ' ,' + (rowHeight/2 + 5) + ')')
   });
   }
   else if( curr_col_type == 'categorical'){
   const allValues = betterData.map(function(elem){return elem[curr_col_name]});
   const uniqueValues = Array.from(new Set(allValues));
   uniqueValues.forEach(function(value) {
   rows.append("rect")
   .attr("width", curr_col_width)
   .attr("height", rowHeight)
   .attr('fill', function(elem){
   return (elem[curr_col_name] === uniqueValues[0]) ? '#666666' : 'white';
   })
   .attr('stroke', 'black')
   .attr('stoke-width', 1)
   .attr("transform", function () {
   return ('translate(' + col_xs[colIndex] + ' ,0)')
   });
   });
   }
   else if( curr_col_type == 'int' ){
   // how big is the range?
   //find min, find max
   const allValues = betterData.map(function(elem){return elem[curr_col_name]}).filter(function(x){return x.length != 0;});
   // complicated min/max to avoid unspecified (zero) entries
   // const min = [].reduce.call(allValues, function(acc, x) {
   //   //console.log("in min, x is: " + x +", x.length is: " + x.length);
   //   return x.length == 0 ? acc : Math.min(x, acc); });
   const min = Math.min( ...allValues );
   const max = Math.max( ...allValues );
   const avg = allValues.reduce(function(acc, x) {
   return parseInt(acc) + parseInt(x);}) / (allValues.length);
   // only rows that have data
   rows.filter((elem)=>{return elem[curr_col_name].toString().length > 0;})
   const radius = 2;
   const scaledRange = (curr_col_width-2*radius) / (max - min);
   rows.append("ellipse")
   .attr("cx", function(elem){
   return Math.floor((elem[curr_col_name]-min) * scaledRange);})
   .attr("cy", rowHeight / 2)
   .attr("rx", radius)
   .attr("ry", radius)
   .attr('stroke', 'black')
   .attr('stroke-width', 1)
   .attr('fill', '#d9d9d9')
   .attr("transform", function () { //yikes these shifts!
   return ('translate(' + (col_xs[colIndex]+radius) + ' ,0)');
   });
   // and a boundary
   rows.append("rect")
   .attr("width", curr_col_width)
   .attr("height", rowHeight)
   .attr('fill', 'transparent')
   .attr('stroke', 'black')
   .attr('stoke-width', 1)
   .attr("transform", function () {
   return ('translate(' + col_xs[colIndex] + ' ,0)');
   });
   // stick on the median
   rows.append("rect") //sneaky line is a rectangle
   .attr("width", 2)
   .attr("height", rowHeight)
   .attr("fill", 'black')
   .attr("transform", function () {
   return ('translate(' + (Math.floor((avg-min) * scaledRange)
   + col_xs[colIndex] - col_margin) + ',0)');
   });
   }
   else
   console.log("oh no, what type is this: " + curr_col_type );
   }
   // end for loop
   const boundary = rows
   .append("rect")
   .attr("class", "boundary")
   .attr('row_pos', function (elem) {
   return elem.y;
   })
   .attr("width", this.width-col_margin)
   .attr("height", rowHeight)
   .attr('stroke', 'transparent')
   .attr('stroke-width', 1)
   .attr('fill', 'none');
   const eventListener = rows.append('rect').attr("height", rowHeight).attr("width", this.width).attr("fill", "transparent")
   // CLICK
   .on('click', function(elem) {
   selectAll('.boundary').classed('tablehovered', false);
   if (!event.metaKey){ //unless we pressed shift, unselect everything
   selectAll('.boundary').classed('tableselected',false);
   }
   selectAll('.boundary').classed('tableselected', function(){
   const rightRow = (select(this).attr('row_pos') == elem.y);
   if(rightRow)
   return (!select(this).classed('tableselected')); //toggle it
   return select(this).classed('tableselected'); //leave it be
   });
   if(event.metaKey)
   events.fire('table_row_selected', elem.id, 'multiple');
   else
   events.fire('table_row_selected', elem.id, 'singular');
   })
   // MOUSE ON
   .on('mouseover', function(elem) {
   selectAll('.boundary').classed('tablehovered', function(){
   const rightRow = (select(this).attr('row_pos') == elem.y);
   if(rightRow){ //don't hover if it's selected
   return !select(this).classed('tableselected');
   }
   return false; //otherwise don't hover
   });
   events.fire('table_row_hover_on', elem.id);
   })
   // MOUSE OFF
   .on('mouseout', function(elem) {
   selectAll('.boundary').classed('tablehovered', false);
   events.fire('table_row_hover_off', elem.id);
   });


   }
   */
  //private update(data){

  //}


  private getWeight(data_elem){
	    if(data_elem.type === 'int')
	      return 3;
	    else if(data_elem.type === 'categorical'){ //make sure to account for # cols
        return 1;
      }
	    return 2;
	  }

 private getTotalWeights(){
      const getWeightHandle = this.getWeight;
	    const weights = this.colData.map(function(elem)
	    { return getWeightHandle(elem);});
      return weights.reduce(function(a, b) { return a + b; }, 0);
	}


// returns a function that takes a column name & returns the width of that column (single category width for cat columns)
	  private getDisplayedColumnWidths(width){
        const buffer = 4;
	      const totalWeight = this.getTotalWeights();
        const getWeightHandle = this.getWeight;
        const availableWidth = width - (2 * this.colData.length);
	      const toReturn = this.colData.map(function(elem, index){
	          const elemWidth = getWeightHandle(elem) * width / totalWeight;
            return {'name':elem['name'], 'width':elemWidth}
	      });
        return toReturn;
	  }

	  private getDisplayedColumnXs(width){
      const buffer = 4;
	    const totalWeight = this.getTotalWeights();
      const colWidths = this.getDisplayedColumnWidths(width);
      return colWidths.map(function(elem, index){
        var x_dist = 0;
        for(let i = 0; i < index; i++){
          x_dist += colWidths[i].width + buffer;
        }
        return {'name':elem['name'], 'x':x_dist};
      });
	  }


	  private getDisplayedColumnMidpointXs(width){
      const buffer = 6;
	    const totalWeight = this.getTotalWeights();
	    const colXs = this.getDisplayedColumnXs(width);
      const colWidths = this.getDisplayedColumnWidths(width);
	    return this.colData.map(function(elem, index){
	        const midPoint = colXs[index].x + (colWidths[index].width/2) ;//+ 40; //TODO WHY
          return {'name':elem['name'], 'x':midPoint};
	    });

	  }


  private attachListener() {
    //NODE BEGIN HOVER
    events.on('row_mouseover', (evt, item) => {
      selectAll('.boundary').classed('tablehovered', function (d) {
        return (!select(this).classed('tablehovered') && !select(this).classed('tableselected') &&
        select(this).attr('row_pos') == item);
      });
    });

    //NODE END HOVER
    events.on('row_mouseout', (evt, item) => {
      return selectAll('.boundary').classed('tablehovered', false);
    });


    // NODE CLICK
    events.on('row_selected', (evt, row, multipleSelection) => {
      selectAll('.boundary').classed('tablehovered', false); //don't hover
      //  console.log(multipleSelection);
      selectAll('.boundary').classed('tableselected', function (a) {
        // if it's the right row, toggle it
        // if it's the wrong row, leave the selection the same
        const rightRow = (select(this).attr('row_pos') == row);
        if (rightRow)
          return (!select(this).classed('tableselected')); //toggle it
        else {
          if (multipleSelection == 'single') { //unless we pressed shift, unselect everything else
            select(this).classed('tableselected', false);
          }
          return select(this).classed('tableselected'); //leave it be
        }


      });
    });


    //TODO
    events.on('rows_aggregated', (evt, item) => {
      //this.all_the_data.aggregateRows();

      // Things that need to happen here:
      // change rows to be joined w. the displayRows instead of displayData- then we have to index each time for every attribute.
      // update the displayedRows datastructure
      //


    });


  }

}

/**
 * Factory method to create a new instance of the Table
 * @param parent
 * @param options
 * @returns {attributeTable}
 */
export function create(parent: Element) {
  return new attributeTable(parent);
}
