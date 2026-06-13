//we will bind an on-click handler for the next page button, but
//handled by the body. This will allow us to replace the button
$('body').off('click').on('click', '.posts .nextpage', function(e) {
	console.log("xxx");
	e.preventDefault(); //block the link click from changing the page
	//fire off an AJAX request to load the next page
	var nextPageUrl = $(this).prop('href');
	$.ajax({
		url: nextPageUrl,
		dataType: 'text', //this is to avoid jQuery running any <script> tags
		success: function(html) {
			var currentContainer = $('#posts');
			//create a temporary hidden element to attach the created document
			//this is the simplest jQuery way to do this safely.
			var tempDiv = $('<div>').appendTo(document.body).css('display', 'none');
			tempDiv[0].innerHTML = html;
			//find the container element in the new document
			var newContainer = tempDiv.find('#posts');
			//replace the container on the current page with the new one
			currentContainer.replaceWith(newContainer);
			//remove the temporary element
			tempDiv.remove();
			//update the URL bar
			if (window.history.pushState)
			{
				window.history.pushState(null, null, nextPageUrl);
			}
			console.log("Successfully changed page to " + nextPageUrl);
		},
		error: function(xhr, status, error) {
			console.error(xhr, status, error);
			//default to non-JS behaviour and click-through as normal
			window.location.href = nextPageUrl;
		}
	})
});
