/**
 * Created by Holger Stitz on 19.12.2016.
 */
import * as events from 'phovea_core/src/event';
import {
    AppConstants,
    ChangeTypes
} from './app_constants';
// import * as d3 from 'd3';

import {
    select,
    selectAll,
    selection,
    mouse
} from 'd3-selection';
import {
    transition
} from 'd3-transition';
import {
    easeLinear
} from 'd3-ease';
import {
    scaleLinear
} from 'd3-scale';
import {
    max,
    min
} from 'd3-array';
import {
    axisTop
} from 'd3-axis';
import {
    format
} from 'd3-format';
import {
    line
} from 'd3-shape';
import {
    curveBasis,
    curveLinear
} from 'd3-shape';
import {
    drag
} from 'd3-drag';


import * as genealogyData from './genealogyData'
import {
    Config
} from './config';




/**
 * Creates the genealogy tree view
 */
class genealogyTree {

    private $node;

    private data;

	private timer;
		
    private width;

    private height;

    private margin = {
        top: 60,
        right: 20,
        bottom: 60,
        left: 40
    };

    private x = scaleLinear();

    private y = scaleLinear();

	private xAxis;

    private startYPos;

    private aggregating_levels

    private interGenerationScale = scaleLinear();

    private self;
    
//     private t = transition('t').duration(500).ease(easeLinear);

    private lineFunction = line < any > ()
        .x((d: any) => {
            return this.x(d.x);
        }).y((d: any) => {
            return this.y(d.y);
        })
        .curve(curveBasis);


    constructor(parent: Element) {
        this.$node = select(parent)
        this.self = this;
        // .append('div')
        // .classed('genealogyTree', true);
    }

    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<FilterBar>}
     */
    init(data) {
        this.data = data;        
        this.build();
        this.attachListener(); 
          

        // return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }


    /**
     * Build the basic DOM elements and binds the change function
     */
    private build() {

        let nodes = this.data.nodes;


        this.width = 600 - this.margin.left - this.margin.right
        this.height = Config.glyphSize * 3 * nodes.length - this.margin.top - this.margin.bottom;


        // Scales
        this.x.range([0, this.width]).domain([min(nodes, function(d) {
            return +d['bdate']
        }), max(nodes, function(d) {
            return +d['ddate']
        }) + 20]);
        this.y.range([0, this.height]).domain([min(nodes, function(d) {
            return d['y']
        }), max(nodes, function(d) {
            return d['y']
        })])
        
        this.xAxis = axisTop(this.x).tickFormat(format("d"))
       
        
        //Filter data to only render what is visible in the current window
        this.update_time_axis();

        //xrange should be defined based only on what is visible on the screen. 

        //When the user scrolls, the x (time) axis should be updated as should the position of all the elements on the screen. 
        
        this.interGenerationScale.range([.75, .25]).domain([2, nodes.length]);
        
        const svg = this.$node.append('svg')
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .attr('id', 'graph')


		
        //append axis
        const axis = svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top / 1.5 + ")")
            .call(this.xAxis)
            .attr('id', 'axis')

		//Add scroll listener for the graph table div	
        document.getElementById('graph_table').addEventListener('scroll', () => {      
		    this.update_time_axis();  
		    /* clear the old timeout */
		    clearTimeout(this.timer);
		    /* wait until 100 ms for callback */
		    this.timer = setTimeout(()=>{this.update_visible_nodes()}, 100);
		});    
		
		//Create group for genealogy tree
        svg.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + Config.glyphSize) + ")")
            .classed('genealogyTree', true)
            .attr('id', 'genealogyTree')

		//Call function that updates the position of all elements in the tree	
        this.update_graph(this.data.nodes, this.data.parentChildEdges, this.data.parentParentEdges)

    }

    //End of Build Function
    
    
    private update_graph(nodes, edges, parentEdges) {
	    
	    this.update_edges(nodes,edges,parentEdges);
	    this.update_nodes(nodes,edges,parentEdges)
        
       }

	//Function that updates the position of all element in the genealogy tree
    private update_edges(nodes, edges, parentEdges) {
	    
	    let t = transition('t').duration(500).ease(easeLinear);

        let graph = select('#genealogyTree')
        
        let edgePaths= graph.selectAll(".edges")
            .data(edges,function(d) {return d['id'];});
            
        //remove extra paths
        edgePaths.exit().transition().duration(400).style('opacity',0).remove();
        
        let edgePathsEnter = edgePaths
        .enter()
        .append("path"); 
        
        edgePaths = edgePathsEnter.merge(edgePaths);
        
        
        edgePathsEnter.attr('opacity',0);
        
        edgePaths
        .attr("class", "edges")
        .transition(t)
        .attr("d", (d) => {
            return this.elbow(d, this.interGenerationScale, this.lineFunction)
        })
        
        
         edgePaths
            .transition(t.transition().ease(easeLinear))
            .attr('opacity',1);
            
            
	   edgePaths
        .attr("stroke-width", 3)
        .on('click', function(d) {
            console.log(d)
        });


        let parentEdgePaths = graph.selectAll(".parentEdges")
            .data(parentEdges,function(d) {return d['id'];});
            
            
        parentEdgePaths.exit().transition().duration(400).style('opacity',0).remove();
            
        let parentEdgePathsEnter = parentEdgePaths    
            .enter()
            .append("path");
           
        parentEdgePathsEnter.attr('opacity',0)
            
            
        parentEdgePaths = parentEdgePathsEnter.merge(parentEdgePaths);
        
        parentEdgePaths
            .attr("class", "parentEdges")
            .style("stroke-width", 4)
            .style("fill", 'none')
            .transition(t)
            .attr("d", (d) => {
                return this.parentEdge(d, this.lineFunction)
            })
            
        parentEdgePaths
            .transition(t.transition().ease(easeLinear))
            .attr('opacity',1);

    };
            
    private update_nodes(nodes, edges, parentEdges) {
	    
	    let t = transition('t').duration(500).ease(easeLinear);

        let graph = select('#genealogyTree')        
        
        
        let allNodes = graph.selectAll(".node")
            .data(nodes.filter((d)=>{return d['visible']}), function(d) {return d['id'];});
            
        allNodes.exit().transition().duration(400).style('opacity',0).remove();
            
            
        let allNodesEnter = allNodes
            .enter()
            .append("g");
            
        allNodes = allNodesEnter.merge(allNodes);
        
        allNodes
            .attr('class', (d) => {
                return 'row_' + d['y']
            })
            .classed("node", true)


        //Add life line groups
        let lifeRectsEnter = allNodesEnter.append("g");
        
        let lifeRects = allNodes.selectAll('g')
        
        lifeRects.exit().remove()
        
        lifeRects        
            .attr('class', 'lifeRect')
            .attr("transform", (d: any) => {
                return d.sex == 'M' ? "translate(0,0)" : "translate(0," + (-Config.glyphSize) + ")";
            });

        //Add actual life lines
        lifeRectsEnter.filter(function(d: any) {
                return (+d.deceased == 1);
            })
            .append("rect")
            
        lifeRects.selectAll('rect')
            .attr('y', Config.glyphSize)
            .attr("width", (d) => {
                return Math.abs(this.x(d['ddate']) - this.x(d['bdate']));
            })
            .attr("height", Config.glyphSize / 4)
            .style('fill', (d: any) => {
                return (+d.affection == 100) ? "black" : "#e0dede";
            })
            .style('opacity', .8)
        //         .style('stroke','none')

        //Add label to lifelines
        lifeRectsEnter
            .append("text")
            .attr('class','ageLabel')
            
         lifeRects.selectAll('.ageLabel')   
            // .attr("y", glyphSize )
            .attr("dy", Config.glyphSize * 0.8)
            .attr("dx", (d) => {
                return Math.abs(this.x(d['ddate']) - this.x(d['bdate']));
            })
            .attr("text-anchor", 'end')
            .text(function(d) {
                return Math.abs(+d['ddate'] - +d['bdate']);
            })
            .attr('fill', function(d: any) {
                return (+d.affection == 100) ? "black" : "#e0dede";
            })
            .style('font-size', Config.glyphSize * 1.5)
            .style('font-weight', 'bold');




        //Add cross through lines for deceased people
        allNodesEnter.filter(function(d: any) {
                return (+d.deceased == 1);
            })
            .append("line")
            
        allNodes.selectAll('line')    
            .attr("x1", function(d: any) {
                return d.sex == 'F' ? -Config.glyphSize : -Config.glyphSize / 2;
            })
            .attr("y1", function(d: any) {
                return d.sex == 'F' ? -Config.glyphSize : -Config.glyphSize / 2;
            })
            .attr("x2", function(d: any) {
                return d.sex == 'F' ? Config.glyphSize : Config.glyphSize * 2.5;
            })
            .attr("y2", function(d: any) {
                return d.sex == 'F' ? Config.glyphSize : Config.glyphSize * 2.5;
            })
            .attr("stroke-width", 3)
            .attr("stroke", "black");


        allNodesEnter.filter(function(d: any) {
                return d['sex'] == 'M';
            })
            .append("rect")
            .classed('male', true);
            
        allNodes.selectAll('.male')
//             .classed('male', true)
            .classed('nodeIcon', true)
            .attr("width", Config.glyphSize * 2)
            .attr("height", Config.glyphSize * 2);



        //Add female node glyphs
        allNodesEnter.filter(function(d: any) {
                return d['sex'] == 'F';
            })
            .append("circle")
            .classed('female', true);
            
        allNodes.selectAll('.female')
            .classed('nodeIcon', true)
            .attr("r", Config.glyphSize);


		allNodesEnter.attr('opacity',0);
		
        //Position and Color all Nodes
        allNodes
         	.transition(t)
            .attr("transform", (d) => {
                return "translate(" + this.xPOS(d) + "," + this.yPOS(d) + ")";
            })
            .style("fill", function(d: any) {
                return (+d.affection == 100) ? "black" : "white";
            })
            .attr('id', (d) => {
                return 'g_' + d['id']
            })
            .style("stroke-width", 3)
            
        allNodes
            .transition(t.transition().ease(easeLinear))
            .attr('opacity',1);


        allNodesEnter
            .append('text')
            .attr('class','nodeLabel')
            
        allNodes.selectAll('.nodeLabel')
            // .attr('visibility','hidden')
            .text(function(d: any) {
                                            if (+d.ddate > 0) {
                                return Math.abs(d['ddate'] - d['bdate']);
                            }
                            else
                                return Math.abs(2016 - d['bdate']);
               
            })
            .attr('dx', function(d) {
                return d['sex'] == 'M' ? Config.glyphSize / 2 : -Config.glyphSize / 2;
            })
            .attr('dy', function(d) {
                return d['sex'] == 'M' ? 1.5 * Config.glyphSize : Config.glyphSize / 2;
            })
            .attr('fill', function(d: any) {
                return (+d.affection == 100) ? "white" : "black";
            })
            .attr('stroke', 'none');




        allNodes.call(drag()
            .on("start", (d) => {
                this.startYPos = this.y.invert(mouse( < any > select('.genealogyTree').node())[1]);
                this.aggregating_levels = new Set();
                this.create_phantom(d)
                
            })
            .on("drag", (d) => {
                let currentY = this.floorY(); //this.y.invert(mouse(<any>select('.genealogyTree').node())[1]);      
                if (currentY > this.startYPos) {
                    //user is dragging down
                    // 		      currentY = this.floorY();
                    this.aggregating_levels.add(currentY);
                } else {
                    // 		      currentY = this.ceilY();
                    this.aggregating_levels.delete(currentY);
                }

                this.aggregating_levels.forEach((level) => {
                    this.create_phantom(this.get_row_data('.row_' + level))
                    this.update_pos_row('.row_' + level)
                });


                //this.update_pos(d)
                this.update_pos_row('.row_' + Math.round(this.startYPos))
                
                //Call function that updates the position of all elements in the tree	
				this.update_edges(this.data.nodes, this.data.parentChildEdges, this.data.parentParentEdges)

            })

            .on("end", (d) => {
                this.aggregating_levels.add(this.closestY())
                
                let indexes =[];
                
                for (let v of this.aggregating_levels){
	                indexes.push(v)
                }
                this.data.aggregateNodes(min(indexes),max(indexes));
                
                this.update_visible_nodes()
                
                
/*
                this.aggregating_levels.forEach((level) => {
                    this.delete_phantom(this.get_row_data('.row_' + level))
                });
*/
            }));


    }

	private update_time_axis(){
		
		
		let scrollOffset = document.getElementById('graph_table').scrollTop;
        let divHeight = document.getElementById('graph_table').offsetHeight;

        // 	          console.log(divHeight, this.y(65),this.y(72), (divHeight + scrollOffset) - 75)

        let minY = this.y.invert(scrollOffset);
        let maxY = this.y.invert(divHeight + scrollOffset - 75)

        //the 75 offset is the transform applied on the group

        //Filter data to adjust x axis to the range of nodes that are visible in the window. 

        let filtered_nodes = this.data.nodes.filter((d) => {
            return d['y'] >= Math.round(minY) && d['y'] <= Math.round(maxY)
        });

		let new_domain = [min(filtered_nodes, function(d) {return +d['bdate']-5}), 
        max(filtered_nodes, function(d) {return +d['ddate'] + 5}) ];
		
        this.x.domain(new_domain);
       
        
        select('#axis')  
        .transition(transition('t2').duration(750).ease(easeLinear))        
        .call(this.xAxis)
        
        
        select("#axis")
            .attr("transform", "translate(" + this.margin.left + "," + (scrollOffset + this.margin.top / 1.5) + ")")
        
    }
        
        
    private update_visible_nodes(){
        
        let scrollOffset = document.getElementById('graph_table').scrollTop;
        let divHeight = document.getElementById('graph_table').offsetHeight;

        // 	          console.log(divHeight, this.y(65),this.y(72), (divHeight + scrollOffset) - 75)

        let minY = this.y.invert(scrollOffset);
        let maxY = this.y.invert(divHeight + scrollOffset - 75)

        let filtered_nodes = this.data.nodes.filter((d) => {
            return d['y'] >= Math.round(minY) 
        });
        
        
        let filtered_parentParentEdges = this.data.parentParentEdges.filter((d) => {
            return d['y2'] >= Math.round(minY)         });
        
        let filtered_parentChildEdges = this.data.parentChildEdges.filter((d) => {
            return d.target.y >= Math.round(minY) 
        });
      
            
    //Call function that updates the position of all elements in the tree	
        this.update_graph(filtered_nodes, filtered_parentChildEdges, filtered_parentParentEdges)
        
            
	        
	}



    private create_phantom(d) {

        let phantom = selectAll('#g_' + d['id']);

        if (phantom.size() == 1) {
            //Create phantom node
            const Node = document.getElementById('g_' + d['id'])

            let phantomNode = Node.cloneNode(true)

            //phantomNode.setAttribute("class", "phantom node");   
            //document.getElementById('genealogyTree').appendChild(phantomNode)

        }
    }

    //Update position of a group based on data 
    private update_pos(d) {

        const node_group = select('#g_' + d['id']);
        const currentPos = mouse( < any > select('.genealogyTree').node());

        node_group.attr("transform", () => {
            return "translate(" + this.xPOS(d) + "," + currentPos[1] + ")";
        })
    }

    //Update position of a group based on a class
    private update_pos_row(class_id) {

        const row_nodes = select(class_id);

        const currentPos = mouse( < any > select('.genealogyTree').node());

        const node = row_nodes.data()[0];

        node['y'] = this.y.invert(currentPos[1])

        row_nodes.attr("transform", () => {
            return "translate(" + this.xPOS(node) + "," + this.yPOS(node) + ")";
        })
    }

    private get_row_data(class_id) {
        return select(class_id).data()[0];

    }



    private closestY() {
        const currentPos = mouse( < any > select('.genealogyTree').node());
        return Math.round(this.y.invert(currentPos[1]))
    }

    private ceilY() {
        const currentPos = mouse( < any > select('.genealogyTree').node());
        return Math.ceil(this.y.invert(currentPos[1]))
    }

    private floorY() {
        const currentPos = mouse( < any > select('.genealogyTree').node());
        return Math.floor(this.y.invert(currentPos[1]))
    }

    private delete_phantom(d) {
        selectAll('.phantom').remove();

        const node_group = select('#g_' + d['id']);

        // 	  node_group.select('.lifeRect').attr('visibility','hidden') 

        const closestY = this.closestY()


        if (d['y'] != closestY) {
            node_group.classed('row_' + d['y'], false);
            d['y'] = closestY;
            node_group.classed('row_' + d['y'], true);

            const row_nodes = selectAll('.row_' + d['y']);

            //Hide all life lines
            row_nodes
                .selectAll('.lifeRect').attr('visibility', 'hidden');
            row_nodes.classed('aggregate', true)
        }



        node_group.attr("transform", () => {
            return "translate(" + this.xPOS(d) + "," + this.yPOS(d) + ")";
        })


    }


    private xPOS(node) {
        if (node['sex'] == 'F')
            return this.x(node.x);
        else
            return this.x(node.x) - Config.glyphSize;
    }

    private yPOS(node) {
        if (node['sex'] == 'F')
            return this.y(node.y);
        else
            return this.y(node.y) - Config.glyphSize
    }



    private attachListener() {

        //Fire Event when first rect is clicked
        this.$node.selectAll('.node')
            .on('mouseover', function(e) {
                events.fire('node_hover_on', select(this).attr('id'));
            })
            .on('mouseout', function(e) {
                events.fire('node_hover_off', select(this).attr('id'));
            });
    }

    private elbow(d, interGenerationScale, lineFunction) {
        const xdiff = d.source.x - d.target.x;
        const ydiff = d.source.y - d.target.y;
        const nx = d.source.x - xdiff * interGenerationScale(ydiff);

        const linedata = [{
            x: d.source.x,
            y: d.source.y
        }, {
            x: nx,
            y: d.source.y
        }, {
            x: nx,
            y: d.target.y
        }, {
            x: d.target.x,
            y: d.target.y
        }];

        if (Config.curvedLines)
            lineFunction.curve(curveBasis);
        else
            lineFunction.curve(curveLinear);

        return lineFunction(linedata);
    }

    private parentEdge(d, lineFunction) {
        const linedata = [{
            x: d.x1,
            y: d.y1
        }, {
            x: d.x2,
            y: d.y2
        }];
        return lineFunction(linedata);
    }
}

/**
 * Factory method to create a new instance of the genealogyTree
 * @param parent
 * @param options
 * @returns {genealogyTree}
 */
export function create(parent: Element) {
    return new genealogyTree(parent);
}