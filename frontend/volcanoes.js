function getVolcanoSearchResult(data){
    return $.ajax({
        type: 'post',
        url:'http://18.208.64.157:3000/volcanoSearch',
        dataType:'json',
        data: data,
        cache: false
    })
}
function getVolcanoColumns() {
    return $.ajax({
        type: 'get',
        url:'http://18.208.64.157:3000/volcanoFields',
        dataType:'json',
        cache: false,
    })
}

let volcanoColumns;

getVolcanoColumns().done((columns)=>{
    volcanoColumns = columns;
    columns.forEach((column) => {
        $("#volcano-columns").append($('<option></option>').val(column).text(column));
    })
})  

function openTab(evt, tabContent) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabContent).style.display = "flex";
    evt.currentTarget.className += " active";
    if($("#myTable").length){
        $("#myTable").remove();
    }
    $("#results-h2").text("");
}

function volcanoSearch() {
    if($("#myTable").length){
        $("#myTable").remove();
    }
    let searchField = $('#volcano-columns').val();
    let searchText = $('#volcano-search-text').val();
    $("#volcano-columns").val(volcanoColumns[0]);
    $('#volcano-search-text').val("");
    getVolcanoSearchResult({text: searchText, field: searchField}).done((output) => {
        displayVolcanoResults(output, "Volcano");
    })
}

function displayVolcanoResults(output) {
    if(output.length) {
        $("#results-h2").html("Volcano Results");
    }
    else {
        $("#results-h2").html("No Results to display");

    }
    var currentRow = 0;
    var nextElement;
    var tableElement = $("<table>", {"id": "myTable", "style": "width:100%"});
    $("#dialog-list").append(tableElement);
    $.each(output, (i, volcano) =>{
        if (i == 0)
        {
            nextElement = $("<tr>", {"id": "myTr" + currentRow});
            $("#myTable").append(nextElement);
        }
        nextElement = $("<td>");
        nextElement.text(volcano.volcano_name);
        nextElement.click(function(){createVolcanoDialogAndOpen(volcano);});
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



function createVolcanoDialogAndOpen(volcano) {
    var dialog = $("#dialog");
    var containerDiv = $("<div></div>")
    var divContent = "<ul class= 'dialog-ul'>";
    var commentField = $("<input />", {id: "comment-input"});
    commentField.attr("class", "inline-text");
    var addCommentButton = $("<button />", {id: "add-comment-button", text: "Add Comment"})
    $("#dialog").empty();
    for (const [key, value] of Object.entries(volcano)) {   
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
            volcano.comments.forEach((comment) => {
                divContent+= "\t\t\t" + i + ". " + comment + "<br />";
                i++;
            })
            divContent+= "</li>";
        }
    }
    divContent +=  "</ul>"; 
    if(volcano["image"] != undefined) {
        getImage({db_filename: volcano.image}).done((volcanoImage) => {
            var image = new Image();
            image.id= "volcano-img";
            image.src = volcanoImage;
            image.width = "400";
            $("#volcano-img").css("maxHeight", 450);
            containerDiv.append(image);

            addCommentField(containerDiv, divContent, dialog, volcano, addCommentButton, commentField);
        })
    }
    else {
        addCommentField(containerDiv, divContent, dialog, volcano, addCommentButton, commentField);
    }
    
}

function addCommentField(containerDiv, divContent, dialog, volcano, addCommentButton, commentField) {
    containerDiv.append(divContent);            
    containerDiv.append(commentField)
    addCommentButton.click(()=> {
        if(commentField.val().trim() !== "" ){
            var comment = commentField.val();
            commentField.val("");
            postComment({volcano_number: volcano.volcano_number, comment: comment})
        }
    })
    containerDiv.append(addCommentButton)
    dialog.append(containerDiv);
    $("#dialog").dialog( "option", "title", volcano.volcano_name );
    $( "#dialog" ).dialog( "open" )
}

function getImage(data) {
    return $.ajax({
        type: 'post',
        url:'http://18.208.64.157:3000/getFile',
        dataType:'text',
        data: data
    })
}

function postComment(data)  {
    return $.ajax({
        type: 'put',
        url:'http://18.208.64.157:3000/commentVolcano',
        dataType:'json',
        data: data,
        cache:false
    })
}

function getNearbyVolcanoes(data) {
    return $.ajax({
        type: 'post',
        url:'http://18.208.64.157:3000/volcanoLocation',
        dataType:'json',
        data: data,
        cache:false
    })
}

function nearbyVolcanoSearch() {
    if($("#myTable").length){
        $("#myTable").remove();
    }
    let lat = $('#volcano-near-lat').val();
    let long = $('#volcano-near-long').val();
    let dist = $('#volcano-near-dist').val() * 1000;

    $('#volcano-near-lat').val("");
    $('#volcano-near-long').val("");
    $('#volcano-near-dist').val("");

    getNearbyVolcanoes({latitude: lat, longitude: long, distance: dist}).done((output) => {
        displayVolcanoResults(output);
    })
    return false;
}