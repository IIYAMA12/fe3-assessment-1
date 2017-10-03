
console.log("Script has started");

var paddingAround = 80;
var svgWidth = 1000,
    svgHeight = 500;



var svgCountainer = d3.select("#svg-container"); // get the container for th graph

var svg = svgCountainer.append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

var width = svgWidth - (paddingAround * 2),
    height = svgHeight - (paddingAround * 2);



// lets create the d3 axes scale functions
// https://github.com/d3/d3-scale
// https://github.com/d3/d3-scale#continuous-scales
// Padding and margins > https://bl.ocks.org/mbostock/3019563

var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
    y = d3.scaleLinear()
    .rangeRound([height, 0]);






// --------------------------------------------------------------------

// This variable is used as information container for the viewer.
var dataViewer = {
    canView:false,
    index:0,
};

// --------------------------------------------------------------------



function showGraph (index) { // this function shows the graph
    var graphData = dataViewer.data[index]; // get the data of the graph
    if (graphData) { // just to be clean, a check if it exists
        console.log("showGraph", index);




        var labels = graphData.data.map(function(data) { // make a new list with labels for the x axis.
            return data.date;
        });
        var values = graphData.data.map(function(data) { // make a new list with values for the y axis
            return data.value;
        });

        console.log("max", d3.max(values));
        x.domain(labels); // at the labels to the x axis of the graph
        y.domain([0,d3.max(values)]);
        // domain is a d3 function: https://www.dashingd3js.com/d3js-scales Used to convert intervals(domain) to new intervals(range).

        svg.html(""); // clear the content of the element before adding new.

        svg.append("text") // title
            .attr("x", svgWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle") // center it
            .html(graphData.country + " - " + graphData.code); // add country and country-code

        var graphGroup = svg.append("g")
            .attr("transform", "translate(" + paddingAround + "," + paddingAround + ")");
        graphGroup.append("g") // x axis
            // ---------------------------
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(d3.axisBottom(x)); // This part is required to show/set the bottom axis.
            // Bostock’s, M //
        console.log("max value:", d3.max(values));
        graphGroup.append("g") // y axis
            // ---------------------------
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(y).ticks(5, "%")) // "%" character after number. 10 = 1%, 2%, 3%, 4%, etc. | When set to: 20 = 0.5%, 1.0%, 1.5%, 2%, 2.5%, 3%, etc.
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -55)
            .attr("x", -170)
            .attr("dy", "0.71em")
            .attr("fill", "black")
            .attr("text-anchor", "middle")
            .text("Population without indoor toilet"); // label left. It didn't work in the original code, so I had to add the fill argument to fix.
            // Bostock’s, M //
        //var barGroup = graphGroup.append("g");

        console.log("x.bandwidth()", x.bandwidth()); // why is 0? -_-"

        graphGroup.selectAll(".bar") // select all created elements within the statement
            // ---------------------------
            .data(graphData.data)
            .enter().append("rect") // create a rectangle
            .attr("class", "bar") // class
            .attr("x", function(data) { // x pos
                //console.log("apply to elements d.name", d.name); When giving the second argument of the function at index 'attr' another <function>,  it will call that <function> for all elements.
                return x(data.date);
            })
            .attr("y", function(data) { // y pos
                return y(data.value);
            })
            .attr("width", x.bandwidth()) // x.bandwidth() It seems like this function only get called only one time. Tested: replaced x.bandwidth() with xBandwidth.
            .attr("height", function(data) {
                return height - y(data.value);
            });
            // Bostock’s, M //

        // Bostock’s, M. (2017, 20 juli). Bar Chart [Source code]. Geraadpleegd van https://bl.ocks.org/mbostock/3885304
        // Licent: https://opensource.org/licenses/GPL-3.0

    }
}

function viewNextGraph (e) { //view next graph
    var nextGraphIndex = dataViewer.index + 1; // update index
    if (nextGraphIndex <= dataViewer.maxIndex) { // can we do the next one? (just to be sure)
        dataViewer.index = nextGraphIndex; // save new index
        showGraph(nextGraphIndex); // change graph
        if (nextGraphIndex !== dataViewer.maxIndex) { // NOT reached the end?
            dataViewer.previousButton.attr('disabled', null); // enable the button
        } else {
            dataViewer.nextButton.attr('disabled', 'disabled'); // disable the button
        }
    }
}

function viewPreviousGraph () { // view previous graph
    var previousGraphIndex = dataViewer.index - 1; // update index
    if (previousGraphIndex >= 0) { // can we do the previous one? (just to be sure)
        dataViewer.index = previousGraphIndex; // save new index
        showGraph(previousGraphIndex); // change graph
        if (previousGraphIndex !== 0) { // NOT reached the beginning?
            dataViewer.nextButton.attr('disabled', null); // enable the button
        } else {
            dataViewer.previousButton.attr('disabled', 'disabled'); // disable the button
        }
    }
}

var ignoreItemKeyForDataProcessing = {code:true, country:true}; // This object is used to filter the raw object data.

d3.json("index.json", // read the json
function(dataset) { // processing
    if (dataset) { // If there is a dataset then do:
        var newFormat = [];
        for (var i = 0; i < dataset.length; i++) { // loop through the data set
            var item = dataset[i];
            var newFormattedRawData = []; // unsort able data.

            for (var prop in item) { // loop through object https://stackoverflow.com/questions/921789/how-to-loop-through-plain-javascript-object-with-objects-as-members
                if (!ignoreItemKeyForDataProcessing[prop]) { // Check if it is known data, if not then execute this part.
                    // console.log(prop);
                    var value = Number(item[prop]); // convert to a number, if it is a number.
                    if (value) { // check if it is a number(see Number() function /\)
                        newFormattedRawData[newFormattedRawData.length] = {date:Number(prop), value:value / 100}; //
                    }
                }
            }
            if (newFormattedRawData.length > 0) { // Any data found except for the known data keys?
                var newFormattedItem = {code:item.code || "", country:item.country || "", data:newFormattedRawData}; // put everything together and make an item.

                newFormat[newFormat.length] = newFormattedItem; // Add the generated item in to the new array. (Using .length instead of i, because some datasets are too much damaged.)
            }
        }

        dataViewer.data = newFormat; // put the data in to the view object.



        dataViewer.canView = true; // Are we ready for viewing? (feature for the future)
        dataViewer.maxIndex = newFormat.length - 1; // Save the max index of the amount of items in the array, so that can we view different data without bugging it by using a wrong index. (see functions viewNextGraph and viewPreviousGraph)



        // make the buttons to view different data.
        var previousButton = svgCountainer.append("button")
            .attr("id", "previousGraph")
            .html("previous")
            .attr('disabled', 'disabled');
        dataViewer.previousButton = previousButton;

        var nextButton = svgCountainer.append("button")
            .attr("id", "nextGraph")
            .html("next");
        dataViewer.nextButton = nextButton;




        // addEventListener for d3 https://stackoverflow.com/questions/27499864/addeventlistener-to-div-appended-in-d3
        previousButton.on("click", viewPreviousGraph); // d3 addEventListener
        nextButton.on("click", viewNextGraph); // d3 addEventListener

        showGraph (0); // show the first graph
    }
});
