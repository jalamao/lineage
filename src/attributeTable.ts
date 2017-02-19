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

/**
* Creates the attribute table view
*/
class attributeTable {

  private $node;

  private width;
  private height;

  private tableAxis;


  // access to all the data in our backend
  private all_the_data;
  private row_order;
  private column_order;
  private num_cols;
  private col_names;
  private row_data;
  private columns;


  private margin = Config.margin;

  constructor(parent:Element) {
    this.$node = select(parent)
    // .append('div')
    // .classed('attributeTable', true);
  }

  /**
  * Initialize the view and return a promise
  * that is resolved as soon the view is completely initialized.
  * @returns {Promise<FilterBar>}
  */
  init(data) {
    this.all_the_data = data;
    this.column_order = data.displayedColumnOrder;
    this.num_cols = data.numberOfColumnsDisplayed;
    this.col_names = data.referenceColumns;

    this.row_order = data.displayedRowOrder;
    this.row_data = data.referenceRows;




    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }


  /**
  * Build the basic DOM elements and binds the change function
  */
  private build() {
    const data = this.row_data.map(function(d){
      return d["value"];
    });

    this.width = 450 - this.margin.left - this.margin.right
    this.height = Config.glyphSize * 3 * data.length - this.margin.top - this.margin.bottom;

    const darkGrey = '#4d4d4d';
    const lightGrey = '#d9d9d9';
    const mediumGrey = '#bfbfbf';
    const lightPinkGrey = '#eae1e1';
    const darkBlueGrey = '#4b6068';

    // Scales
    let x = scaleLinear().range([0 , this.width]).domain([1 ,1]);
    let y = scaleLinear().range([0, this.height]).domain([min(data,function(d){return d['y']}), max(data,function(d){return d['y']}) ])

    let tableAxis = axisTop(x).tickFormat(format("d"));

/*
    this.column_order = data.displayedColumnOrder;
    this.num_cols = data.numberOfColumnsDisplayed;
    this.col_names = data.referenceColumns;
  */


  //this.column_order[d].width  -> map over this to get width index, we'll update this on events

  // this.columns

    // TODO: base these off the data in Columns
    // TODO: make an array w. widths and pop based on col's
    const rowHeight = Config.glyphSize * 2.5 - 4;


    const genderWidth = this.width / 7;
    const ageWidth = 3 * this.width / 7;
    const bmiWidth = 2 * this.width / 7;
    const medianBMI = ageWidth + genderWidth + (bmiWidth/2);
    const deceasedWidth = this.width - (ageWidth + genderWidth + bmiWidth);

    const svg = this.$node.append('svg')
    .attr('width', this.width + this.margin.left + this.margin.right)
    .attr("height", this.height + this.margin.top + this.margin.bottom)

    const axis = svg.append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top / 1.5 + ")")
        .attr('id', 'axis')

    const num_cols = this.num_cols; // because this in js is stupid
    const col_names = this.col_names;
    const totalWidth = this.width;
    const col_order = this.column_order;


    // this.row_data.map(function(d){
    //   return d["value"];
    // });

    // holds the x pos of the left-most edge of each column
    var col_xs = this.column_order.map(function(index){
      var x_dist = 0;
      for (var i = 0; i < index; i++) {
        x_dist += col_names[i].width * totalWidth / num_cols
      }
      return x_dist;
    });

    // holds the x pos of the midpoint of each column
     var label_xs = this.column_order.map(function(index){
        const label_pos =
        col_xs[index] + (col_names[index].width * totalWidth /num_cols)/2;
        return label_pos - 35; //TODO: what's going on here?
     });

     // ^^ UPDATE THOSE ON EVENTS- IS THIS A BAD DESIGN?



    axis.selectAll(".table_header")
    .data(this.column_order)
    .enter()
    .append("text")
            .text(function(index) { return col_names[index].name; })
            .attr('fill', 'black')
      			.attr("transform", function (index) {
                return "translate(" + label_xs[index] + ", 20) rotate(-45)";
            });
    const table = svg.append("g")
    .attr("transform", "translate(0," + this.margin.top + ")")

    let rows = table.selectAll(".row")
    //.data(data)
    .data(this.row_order.map(function(index){
      return index[0]; //TODO! aggregation!
    })) //, function(d) {return d;})
    .enter()
    .append("g")
    .attr('id', function (d) {
      return ('row_' + data[d].id)
    })
    .attr('class', 'row')
    .attr("transform", function (d, i) {
      return ('translate(0, ' + y(data[d].y)+ ' )')
    });


    // const num_cols = this.num_cols; // because this in js is stupid
    // const col_names = this.col_names;

    for (let i = 0; i < num_cols; i++) {
      rows.append("rect")
      //.attr("class", "genderCell")
      .attr("width", col_xs[i])
      .attr("height", rowHeight) // to do by attribute type?
      .attr('fill', function (d) {

        return data[d][col_names[col_order[i]]] == 'F' ? lightPinkGrey : darkBlueGrey;
      });
    }



    // var col_xs = this.column_order.map(function(index){
    //   var x_dist = 0;
    //   for (var i = 0; i < index; i++) {
    //     x_dist += col_names[i].width * totalWidth / num_cols
    //   }
    //   return x_dist;
    // });
    //
    // // holds the x pos of the midpoint of each column
    //  var label_xs = this.column_order.map(function(index){
    //     const label_pos =
    //     col_xs[index] + (col_names[index].width * totalWidth /num_cols)/2;
    //     return label_pos - 35; //TODO: what's going on here?
    //  });

/*
    const genderCell = rows
    .append("rect")
    .attr("class", "genderCell")
    .attr("width", genderWidth)
    .attr("height", rowHeight)
    .attr('fill', function (d) {
      return data[d].sex == 'F' ? lightPinkGrey : darkBlueGrey;
    });


    const ageCell = rows
    .append("rect")
    .attr("class", "ageCell")
    .attr("width", function (d) {
      if(data[d].ddate - data[d].bdate > 0)
      return (data[d].ddate - data[d].bdate)* ageWidth / 100;
      else
      return 15;  // TODO
    })
    .attr("height", rowHeight)
    .attr('fill', mediumGrey) //light grey
    .attr('stroke', '#a6a6a6') //slightly darker grey
    .attr('stroke-width', 1)
    .attr("transform", function (d, i) {
      return ('translate(' + genderWidth + ' )')
    });




//// BMI



// central ref line
    rows.append("line")
    .attr("x1", medianBMI)
    .attr("y1", 0)
    .attr("x2", medianBMI)
    .attr("y2", rowHeight)
    .attr("stroke-width", 1)
    .attr("stroke", "#cccccc");



    const circleCell = rows.append("ellipse")
    .attr("cx",      function(d){
                        if(data[d].maxBMI)
                          return medianBMI + data[d].maxBMI;
                        else
                          return medianBMI;
                      })
    .attr("cy", rowHeight / 2)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', '#d9d9d9');
    //.attr("fill", 'red');

//// END BMI





    const deceasedCell = rows
    .append("rect")
    .attr("class", "deceasedCell")
    .attr("width", deceasedWidth) //Config.glyphSize * 10)
    .attr("height", rowHeight)
    .attr('fill', function (d) {    // dk grey   lt grey
      return data[d].deceased == 1 ? lightGrey : darkGrey;
    })
    .attr("transform", function (d, i) {
      return ('translate(' + (genderWidth + ageWidth + bmiWidth) + ' )')
    });






    const boundary = rows
    .append("rect")
    .attr("class", "boundary")
    // .attr('y', function (d) {
    //   return (d.y)
    // })
    .attr('row_pos', function (d) {
      return data[d].y;
    })
    .attr("width", this.width)
    .attr("height", rowHeight)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'none');


// seperate out gender
    rows.append("line")
    .attr("x1", genderWidth)
    .attr("y1", 0)
    .attr("x2", genderWidth)
    .attr("y2", rowHeight)
    .attr("stroke-width", 1)
    .attr("stroke", "black");


// seperate out age
    rows.append("line")
    .attr("x1", ageWidth + genderWidth)
    .attr("y1", 0)
    .attr("x2", ageWidth + genderWidth)
    .attr("y2", rowHeight)
    .attr("stroke-width", 1)
    .attr("stroke", "black");

// seperate out bmi
    rows.append("line")
    .attr("x1", ageWidth + genderWidth + bmiWidth)
    .attr("y1", 0)
    .attr("x2", ageWidth + genderWidth + bmiWidth)
    .attr("y2", rowHeight)
    .attr("stroke-width", 1)
    .attr("stroke", "black");

*/

  const eventListener = rows.append('rect').attr("height", rowHeight).attr("width", this.width).attr("fill", "transparent")
  // CLICK
  .on('click', function(d) {
    selectAll('.boundary').classed('tablehovered', false); /*function(a){
      const rightRow = (select(this).attr('row_pos') == d.y);
      if(rightRow)
        return (!select(this).classed('tablehovered')); //toggle it
      return false; //dont do shit
    }); */
    if (!event.metaKey){ //unless we pressed shift, unselect everything
         selectAll('.boundary').classed('tableselected',false);
    }
    selectAll('.boundary').classed('tableselected', function(a){
      const rightRow = (select(this).attr('row_pos') == data[d].y);
      if(rightRow)
        return (!select(this).classed('tableselected')); //toggle it
      return select(this).classed('tableselected'); //leave it be
    });
    if(event.metaKey)
      events.fire('table_row_selected', data[d].y, 'multiple');
    else
      events.fire('table_row_selected', data[d].y, 'singular');
  })

  // MOUSE ON
  .on('mouseover', function(d) {
    selectAll('.boundary').classed('tablehovered', function(a){
      const rightRow = (select(this).attr('row_pos') == data[d].y);
      if(rightRow){ //don't hover if it's selected
        return !select(this).classed('tableselected');
      }
      return false; //otherwise don't hover
    });
    events.fire('table_row_hover_on', data[d].y);
  })

  // MOUSE OFF
  .on('mouseout', function(d) {
    selectAll('.boundary').classed('tablehovered', false);
    events.fire('table_row_hover_off', data[d].y);
  });

  }

  private update(data){

  }


  private attachListener() {
    //NODE BEGIN HOVER
    events.on('row_mouseover', (evt, item)=> {
      selectAll('.boundary').classed('tablehovered', function (d) {
        return (!select(this).classed('tablehovered') && !select(this).classed('tableselected') &&
        select(this).attr('row_pos') == item);
      });
    });

    //NODE END HOVER
    events.on('row_mouseout', (evt, item)=> {
      return selectAll('.boundary').classed('tablehovered',false);
    });


    // NODE CLICK
    events.on('row_selected', (evt, row, multipleSelection)=> {
        selectAll('.boundary').classed('tablehovered', false); //don't hover
        console.log(multipleSelection);
        if (multipleSelection == 'single'){ //unless we pressed shift, unselect everything
             selectAll('.boundary').classed('tableselected',false);
        }
        selectAll('.boundary').classed('tableselected', function(a){
          // if it's the right row, toggle it
          // if it's the wrong row, leave the selection the same
          const rightRow = (select(this).attr('row_pos') == row);
          if(rightRow)
            return (!select(this).classed('tableselected')); //toggle it
          return select(this).classed('tableselected'); //leave it be
        });
    });


    //TODO
    events.on('rows_aggregated', (evt, item)=> {
      //this.all_the_data.aggregateRows();

      // Things that need to happen here:
      // change rows to be joined w. the displayRows instead of displayData- then we have to index each time for every attribute.
      // update the displayedRows datastructure
      //


    });


  }

}

/**
* Factory method to create a new instance of the genealogyTree
* @param parent
* @param options
* @returns {attributeTable}
*/
export function create(parent:Element) {
  return new attributeTable(parent);
}
