function getEruptionSearchResult(data){
    return $.ajax({
        type: 'post',
        url:'http://18.208.64.157:3000/eruptionSearch',
        dataType:'json',
        data: data,
        cache: false
    })
}
function getEruptionColumns() {
    return $.ajax({
        type: 'get',
        url:'http://18.208.64.157:3000/eruptionFields',
        dataType:'json',
        cache: false,
    })
}

let eruptionColumns;

getEruptionColumns().done((columns)=>{
    eruptionColumns = columns;
    columns.forEach((column) => {
        $("#eruption-columns").append($('<option></option>').val(column).text(column));
    })
})  

function eruptionSearch() {
    if($("#myTable").length){
        $("#myTable").remove();
    }
    let searchField = $('#eruption-columns').val();
    let searchText = $('#eruption-search-text').val();
    $("#eruption-columns").val(eruptionColumns[0]);
    $('#eruption-search-text').val("");
    getEruptionSearchResult({text: searchText, field: searchField}).done((output) => {
        displayEruptionResults(output);
    })
}

function displayEruptionResults(output) {
    if(output.length) {
        $("#results-h2").html("Eruption Results");
    }
    else {
        $("#results-h2").html("No Results to display");

    }
    var currentRow = 0;
    var nextElement;
    var tableElement = $("<table>", {"id": "myTable", "style": "width:100%"});
    $("#dialog-list").append(tableElement);
    $.each(output, (i, eruption) =>{
        if (i == 0)
        {
            nextElement = $("<tr>", {"id": "myTr" + currentRow});
            $("#myTable").append(nextElement);
        }
        nextElement = $("<td>");
        nextElement.text(eruption.volcano_name);
        nextElement.click(function(){createEruptionDialogAndOpen(eruption);});
        $("#myTr" + currentRow).append(nextElement);
        if ((i + 1) % 3 === 0)
        {
            nextElement = $("</tr>");
            $(myTable).append(nextElement);
            currentRow++;
            nextElement = $("<tr>", {"id": "myTr" + currentRow});
            $(myTable).append(nextElement);
        }
    });
    nextElement = $("</table>");
    $("#myTable").append(nextElement);
    $("#dialog").dialog({
    autoOpen: false,
    width: 600,
    buttons: [
        {
            text: "OK",
            click: function() {
                $( "#dialog" ).dialog( "close" );
            }
        }
    ]
    });
    $("#table-container").css("display", "block");
}

function createEruptionDialogAndOpen(eruption) {
    var dialog = $("#dialog");
    var containerDiv = $("<div></div>")
    var divContent = "<ul class= 'dialog-ul'>";
    var commentField = $("<input />", {id: "comment-input"});
    commentField.attr("class", "inline-text");
    var addCommentButton = $("<button />", {id: "add-comment-button", text: "Add Comment"})
    $("#dialog").empty();
    for (const [key, value] of Object.entries(eruption)) {   
        if(value != "" && (key!='_id' && key!='loc' && key!= "comments" && key!= "image" )) {
            divContent += "<li><font color='#18ADEA'><b>" + key + ":&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font></b>" + value + "</<li>"	
        }
        if(key == 'loc') {
            divContent += "<li><font color='#18ADEA'><b>" + "coordinates" + ":&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font></b>" 
                        + value.coordinates[1] + ", " + value.coordinates[0] + "</<li>"	
        }
        if(key == "comments") {
            divContent += "<li><font color='#18ADEA'><b>" + key + ":</font></b>"
            let i=1;
            eruption.comments.forEach((comment) => {
                divContent+= "\t\t\t" + i + ". " + comment + "<br />";
                i++;
            })
            divContent+= "</li>";
        }
    }
    divContent +=  "</ul>"; 
    addEruptionCommentField(containerDiv, divContent, dialog, eruption, addCommentButton, commentField);
}

function addEruptionCommentField(containerDiv, divContent, dialog, eruption, addCommentButton, commentField) {
    containerDiv.append(divContent);            
    containerDiv.append(commentField)
    addCommentButton.click(()=> {
        if(commentField.val().trim() !== "" ){
            var comment = commentField.val();
            commentField.val("");
            postEruptionComment({eruption_number: eruption.eruption_number, comment: comment})
        }
    })
    containerDiv.append(addCommentButton)
    dialog.append(containerDiv);
    $("#dialog").dialog( "option", "title", eruption.volcano_name );
    $( "#dialog" ).dialog( "open" )
}

function postEruptionComment(data)  {
    return $.ajax({
        type: 'put',
        url:'http://18.208.64.157:3000/commentEruption',
        dataType:'json',
        data: data,
        cache:false
    })
}

function getNearbyEruptions(data) {
    return $.ajax({
        type: 'post',
        url:'http://18.208.64.157:3000/eruptionLocation',
        dataType:'json',
        data: data,
        cache:false
    })
}

function nearbyEruptionSearch() {
    if($("#myTable").length){
        $("#myTable").remove();
    }
    let lat = $('#eruption-near-lat').val();
    let long = $('#eruption-near-long').val();
    let dist = $('#eruption-near-dist').val() * 1000;

    $('#eruption-near-lat').val("");
    $('#eruption-near-long').val("");
    $('#eruption-near-dist').val("");


    getNearbyEruptions({latitude: lat, longitude: long, distance: dist}).done((output) => {
        displayEruptionResults(output);
    })
    return false;
}