$(function() {
	//remove a tag jump
	( function( $ ) {
	   $( 'a[href="#"]' ).click( function(e) {
	      e.preventDefault();
	   } );
	} )( jQuery );

	//scroll to sections with links
	function scrollToId(id) {
		var tag = $("#" + id);
		$('html,body').animate({scrollTop: tag.offset().top},'slow');
	}

	//set up click events for each section link
	var sections = ["what", "who", "why", "how", "me"];
	$.each(sections, function(key, value) {
		$("." + value + "Button").click(function() {
	   		scrollToId(value + "Section");
		});
	});
})