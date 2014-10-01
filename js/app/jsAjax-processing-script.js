/*
 * JavaScript Dashboard Class
 * Created On: 24-MAY-2014
 * Created By: Ogbuitepu O. Patrick
 *
 *pageshow
*/
/*
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','js/analytics.js','ga');*/

var customUUID = getData( 'custom-uuid' );
if( ! customUUID ){
	var launch_date = new Date();
	var customUUID = launch_date.getTime();
	putData( 'custom-uuid' , customUUID );
}
/*
ga('create', 'UA-49474437-2', {
	'storage': 'none',
	//'clientId':device.uuid
	'clientId':customUUID
});
ga('send', 'pageview', {'page': '/app-init' , 'title': 'App Initialized' });
*/
window.addEventListener('load', function() {
    FastClick.attach(document.body);
}, false);

var storeObjects = {};

function cannot_initiate_app(){
	var settings = {
		message_title:'Cannot Initiate App',
		message_message: 'Please contact our customer care',
		auto_close: 'no'
	};
	display_popup_notice( settings );
};

function validate( $element , unfocused ){
	var tit = "Error Title";
	var msg = "Error Msg";
	var err = false;
	
	if( $element.attr('data-validate') && $element.attr('required') ){
		switch( $element.attr('data-validate') ){
		case 'text':
		case 'number':
		case 'tel':
			if( $element.val().length < 1 ){
				err = true;
			}
		break;
		case 'email':
			var email = $element.val();
			var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
			if( email.length<1 || !emailReg.test( email ) ) {
				err = true;
			}
		break;
		case 'confirm-email':
			var email = $element.val();
			var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
			if( email.length<1 || !emailReg.test( email ) ) {
				err = true;
			}
			
			var $emails = $element.parents('form').find('input[type="email"]');
			if( $emails ){
				if( $emails.length > 1 ){
					$emails.each(function(){
						if( email != $(this).val() )err = true;
					});
				}else{
					if( email != $emails.val() )err = true;
				}
			}
		break;
		case 'password':
			if( $element.val().length < 6 ) {
				err = true;
			}
		break;
		case 'confirm-password':
			var pw = $element.val();
			var $pws = $element.parents('form').find('input[type="password"]');
			if( $pws ){
				if( $pws.length > 1 ) {
					$pws.each(function(){
						if( pw != $(this).val() )err = true;
					});
				}else{
					if( pw != $pws.val() )err = true;
				}
			}
		break;
		}
		
		if( err ){
			if( $element.attr('data-error-title') )tit = $element.attr('data-error-title');
			if( $element.attr('data-error-msg') )msg = $element.attr('data-error-msg');
			if( unfocused )$element.focus().select();
		}
	}
	
	var validated = {
		error: err,
		title: tit,
		message: msg,
	};
	return validated;
};

function transform_data( $form ){
	var data = $form.serializeArray();
	
	var error = {};
	var txData = { error:false };
	var unfocused = true;
	
	$.each( data , function( key , value ){
		var $input = $form.find('#'+value.name+'-field');
		if( $input ){
			if( $input.attr('data-validate') ){
				var validated = validate( $input , unfocused );
				
				if( ! ( error.error ) && validated.error ){
					//throw error & display message
					error = validated;
					unfocused = false;
				}else{
					//start storing object
					txData[ value.name ] = value.value;
				}
				
			}else{
				txData[ value.name ] = value.value;
			}
		}
	});
	
	if( error.error ){
		return error;
	}
	
	return txData;
};

function store_record( data ){
	if( data.object ){
		var launch_date = new Date();
		var key = launch_date.getTime();
		
		switch( data.object ){
		case 'inventory':
			//use barcode as key
			if( data.item_barcode )
				key = data.item_barcode;
			
			if( ! data.item_sold )data.item_sold = 0;
			if( ! data.income )data.income = 0;
			if( ! data.sales )data.sales = {};
		break;
		}
		
		var d = {};
		
		if( data.key ){
			key = data.key;
			var d = getData( key );
		}else{
			data.key = key;
		}
		
		data.timestamp = launch_date.getTime();
		if( d && d.creationtimestamp ){
			data.creationtimestamp = d.creationtimestamp;
		}else{
			data.creationtimestamp = data.timestamp;
		}
		//add details like = creation time, user etc.
		
		//perm storage
		putData( key , data );
		
		//test if object is stored
		var test = getData( key );
		if( test.key && test.key == key ){
			
			var keys = getData( data.object );
			if( ! keys )var keys = {};
			keys[ key ] = key;
			putData( data.object , keys );
			
			//temp storage
			if( storeObjects[ data.object ] ){
				storeObjects[ data.object ][ test.key ] = test;
			}else{
				var d = {};
				d[ test.key ] = test;
				storeObjects[ data.object ] = d;
			}
			
			return test;
		}
		
		//var s = amplify.store();
		//console.log('all',  s );
	}
};

function get_user_info(){
	if( storeObjects[ 'user_info' ] ){
		return storeObjects[ 'user_info' ];
	}
	
	var object = 'sign-up';
	var keys = getData( object );
	
	if( keys ){
		var count = 0;
		$.each( keys , function( key , value ){
			if( count ){
				clearSingleData( key );
			}
			++count;
		});
		var keys = getData( object );
	}
	
	if( keys ){
		for (var key in keys ) break;
		storeObjects[ 'user_info' ] = getData( key );
		return storeObjects[ 'user_info' ];
	}
};

function handle_form_submission( $form ){
	
	$form
	.on('submit', function( e ){
		e.preventDefault();
		
		//transform data
		var data = transform_data( $(this) );
		
		if( data.error ){
			//display error message
			var settings = {
				message_title:data.title,
				message_message: data.message,
				auto_close: 'no'
			};
			display_popup_notice( settings );
		}else{
			//store data
			data[ 'object' ] = $(this).attr('name');
			var stored = store_record( data );
			successful_submit_action( stored );
			
			$form
			.find('input')
			.val('');
			
		}
		
		return false;
	});
};

function successful_submit_action( stored ){
	//console.log('stored', stored );
	var title = 'Saved!';
	var msg = 'Data successfully stored';
	
	switch( stored.object ){
	case 'suppliers':
		var suppliers_list = add_to_list_of_suppliers( stored );
		update_suppliers_list_on_suppliers_page();
	break;
	case 'sign-up':
		if( stored.creationtimestamp && stored.creationtimestamp != stored.timestamp ){
			storeObjects[ 'user_info' ] = stored;
		}else{
			title = 'Welcome!';
			msg = 'Thank you for choosing blubird';
			
			$.mobile.navigate( "#dashboard", { transition : "none" });
		}
	break;
	case 'inventory':
		//add - ! (item desc | barcode | cateogry | location ) to stock_level object 
		var stock = {
			item_barcode: stored.item_barcode,
			cost_price: stored.cost_price,
			expiry_date: stored.expiry_date,
			location: stored.location,
			selling_price: stored.selling_price,
			amount_paid: stored.amount_paid,
			amount_owed: stored.amount_owed,
			supplier: stored.supplier,
			item_qty: stored.item_qty,
			object: "stock",
			error: false,
		};
		var stocked = store_record( stock );
		
		var stock = {};
		stock[ stocked.key ] = stocked.key;
		stored.stock = stock;
		putData( stored.key , stored );
		
		//get supplier id
		if( stored.supplier ){
			var supplier = getData( stored.supplier );
			
			if( ! supplier.stock ){
				supplier.stock = {}
			}
			supplier.stock[ stocked.key ] = stocked.key;
			
			putData( stored.supplier , supplier );
			
			if( ! storeObjects[ 'suppliers_list' ] ){
				storeObjects[ 'suppliers_list' ] = {};
			}
			
			storeObjects[ 'suppliers_list' ][ stored.supplier ] = supplier;
		}
		
		if( ! storeObjects[ 'inventory_list' ] ){
			storeObjects[ 'inventory_list' ] = get_list_of_inventory();
		}
		
		storeObjects[ 'inventory_list' ][ stored.key ] = stored;
		
		if( ! storeObjects[ 'total_newly_listed_inventory' ] )
			storeObjects[ 'total_newly_listed_inventory' ] = 0;
			
		storeObjects[ 'total_newly_listed_inventory' ] += stored.cost_price * stored.item_qty;
		/*
		$('#newly-listed-inventory-container')
		.prepend( '<div class="ui-block-a"><p>'+stored.item_desc+'</p></div><div class="ui-block-b"><p>'+stored.item_qty+'</p></div>' );
		*/
		
		title = 'Stored!';
		msg = 'Inventory successfully created';
	break;
	case 'stock':
		//add stock to inventory
		var inventory = getData( stored.item_barcode );
		
		inventory.cost_price = stored.cost_price;
		inventory.selling_price = stored.selling_price;
		inventory.amount_paid = stored.amount_paid;
		inventory.expiry_date = stored.expiry_date;
		inventory.item_qty = parseFloat(inventory.item_qty) + parseFloat( stored.item_qty );
		inventory.item_available = inventory.item_qty - inventory.item_sold;
		
		if( ! inventory.stock ){
			inventory.stock = {};
		}
		inventory.stock[ stored.key ] = stored.key;
		
		putData( inventory.key , inventory );
		storeObjects[ 'inventory_list' ][ inventory.key ] = inventory;
		
		//get supplier id
		if( stored.supplier ){
			var supplier = getData( stored.supplier );
			
			if( ! supplier.stock ){
				supplier.stock = {}
			}
			supplier.stock[ stored.key ] = stored.key;
			
			putData( stored.supplier , supplier );
			
			if( ! storeObjects[ 'suppliers_list' ] ){
				storeObjects[ 'suppliers_list' ] = {};
			}
			storeObjects[ 'suppliers_list' ][ stored.supplier ] = supplier;
		}
		
		title = 'Saved!';
		msg = 'Inventory successfully re-stocked';
	break;
	case 'sales':
		$.each( stored.inventory , function( key , value ){
			var inventory = getData( key );
			/*might be remove*/
			if( inventory.item_sold ){
				inventory.item_sold += value.unit_ordered;
				inventory.income += value.unit_selling_price;
			}else{
				inventory.item_sold = value.unit_ordered;
				inventory.income = value.unit_selling_price;
			}
			
			if( inventory.sales ){
				inventory.sales[ stored.key ] = stored.key;
			}else{
				inventory.sales = {};
				inventory.sales[ stored.key ] = stored.key;
			}
			
			putData( key , inventory );
			
			storeObjects[ 'inventory_list' ][ key ] = inventory;
		});
		
		//storeObjects[ 'sales' ][ stored.key ] = stored;
		
		title = 'Sold!';
		msg = 'Sales was successful';
	break;
	}
	
	var settings = {
		message_title:title,
		message_message: msg,
		auto_close: 'yes'
	};
	display_popup_notice( settings );
};

function add_to_list_of_suppliers( data ){
	if( storeObjects[ 'suppliers_list' ] ){
		storeObjects[ 'suppliers_list' ];
	}else{
		get_list_of_suppliers();
	}
	
	storeObjects[ 'suppliers_list' ][ data.key ] = data;
	
	$( '#suppliers-list-container' )
	.find('#'+data.key)
	.remove();
	
	$( '#suppliers-list-container' )
	.prepend( get_supplier_html( data.key , data ) );
};

function get_list_of_suppliers(){
	if( storeObjects[ 'suppliers_list' ] ){
		storeObjects[ 'suppliers_list' ];
	}else{
		var object = 'suppliers';
		var keys = getData( object );
		var suppliers_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				suppliers_list[ key ] = getData( key );
			});
		}
		
		storeObjects[ 'suppliers_list' ] = suppliers_list;
		
	}
	return storeObjects[ 'suppliers_list' ];
};

function get_list_of_inventory(){
	if( storeObjects[ 'inventory_list' ] ){
		storeObjects[ 'inventory_list' ];
	}else{
		var object = 'inventory';
		var keys = getData( object );
		var inventory_list = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				inventory_list[ key ] = getData( key );
				/*
				inventory_list[ key ].total_qty = 0;
				if( inventory_list[ key ].stock ){
					$.each( inventory_list[ key ].stock , function( k , v ){
						var stock = getData( k );
						inventory_list[ key ].total_qty += parseFloat( stock.item_qty );
					} );
				}
				*/
			});
			
		}
		
		storeObjects[ 'inventory_list' ] = inventory_list;
	}
	return storeObjects[ 'inventory_list' ];
};

function get_sales(){
	if( storeObjects[ 'sales' ] ){
		storeObjects[ 'sales' ];
	}else{
		var object = 'sales';
		var keys = getData( object );
		var sales = {};
		
		if( keys ){
			$.each( keys , function( key , value ){
				sales[ key ] = getData( key );
				/*
				inventory_list[ key ].total_qty = 0;
				if( inventory_list[ key ].stock ){
					$.each( inventory_list[ key ].stock , function( k , v ){
						var stock = getData( k );
						inventory_list[ key ].total_qty += parseFloat( stock.item_qty );
					} );
				}
				*/
			});
			
		}
		
		storeObjects[ 'sales' ] = sales;
	}
	return storeObjects[ 'sales' ];
};

function get_inventory_html( key , value ){
	return '<tr id="'+key+'" class="'+value.category.replace(' ', '-')+' '+value.location.replace(' ', '-')+'"><td class="label">'+value.item_desc+'</td><td class="qty">'+value.item_qty+'</td></tr>';
};

function get_supplier_html( key , value ){
	return '<tr id="'+key+'" timestamp="'+value.timestamp+'"><td>'+value.supplier+' ('+value.location+')</td></tr>';
};

$( document ).on( "pagecreate", "#dashboard", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			$('.app-user-name').text( 'Welcome ' + userInfo.name + '!' );
			
		}else{
			//signup
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
	
});

$( document ).on( "pageshow", "#dashboard", function() {
	
	//if( $('.app-user-name').text().length < 4 ){
		var userInfo = get_user_info();
		if( userInfo ){
			$('.app-user-name').text( 'Welcome ' + userInfo.name + '!' );
		}
	//}
	
	var inventory = get_list_of_inventory();
	
	var label = new Array();
	var values1 = new Array();
	var values2 = new Array();
	var i = 0;
	
	var total_value = 0;
	var total_items = 0;
	
	$.each( inventory , function( key , value ){
		if( ! value.item_sold )value.item_sold = 0;
		
		total_value += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) )* value.selling_price;
		total_items += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
		
		label[i] = value.item_desc;
		values2[i] = value.item_qty;
		values1[i] = value.item_sold;
		++i;
	});
	
	if( label && values1 && values2 && i ){
		var data = {};
		data.label = label;
		data.value1 = values1;
		data.value2 = values2;
		data.id = 'chart5';
		data.axislabel = new Array();
		data.axislabel[0] = {label:'Quantity Sold'};
		data.axislabel[1] = {label:'Remaining Stock'};
		
		activate_bar_chart( data );
	}
	
	$('.total-value-of-inventory')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-items-in-stock')
	.html( formatNum( total_items ) );
	
	var sales = get_sales();
	var total_value = 0;
	var total_items = 0;
	var total_cost_price = 0;
	var total_vat = 0;
	
	var date = new Date();
	var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
	var today_total_days = 0;
	var today_cost_price_days = 0;
	
	var most_selling = new Array();
	
	$.each( sales , function( key , value ){
		if( value.subtotal )total_value += parseFloat( value.subtotal );
		if( value.vat )total_vat += parseFloat( value.vat );
		
		if( value.total_units )total_items += parseFloat( value.total_units );
		if( value.total_cost_price )total_cost_price += parseFloat( value.total_cost_price );
		
		var date = new Date(value.timestamp);
		// hours part from the timestamp
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		
		value.day = year + '-' + month + '-' + day;
		
		if( value.day == today ){
			today_total_days += parseFloat( value.total_amount );
			today_cost_price_days += parseFloat( value.total_cost_price );
			
			$.each( value.inventory , function( k, v){
				if( most_selling[ k ] ){
					var  ini = most_selling[ k ];
					most_selling[ k ] = {
						units: parseFloat( v.unit_ordered ) + ini.units,
						total_amount: parseFloat( v.unit_ordered * v.unit_selling_price ) + ini.total_amount,
						id: k,
						item_desc: inventory[k].item_desc
					}
				}else{
					most_selling[ k ] = {
						units: parseFloat( v.unit_ordered ),
						total_amount: parseFloat( v.unit_ordered * v.unit_selling_price ),
						id: k,
						item_desc: inventory[k].item_desc
					}
				}
			});
		}
		
	});
	
	$('.today-total-sales-amount')
	.html( appCurrency + formatNum(today_total_days.toFixed(2) ) );
	
	$('.total-sales-amount')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-sales-tax')
	.html( appCurrency + formatNum(total_vat.toFixed(2) ) );
	
	$('.total-sales-units')
	.html( formatNum( total_items ) );
	
	var profit = total_value - total_cost_price;
	var today_profit = today_total_days - today_cost_price_days;
	
	$('.today-gross-profit')
	.html( appCurrency + formatNum(today_profit.toFixed(2) ) );
	
	if( total_value ){
		most_selling.sort(function(a,b){
			return b.units - a.units;
		});
		
		var j = 5;
		if( most_selling.length < j ){
			j = most_selling.length;
		}
		
		if( j ){
			var dtset = new Array();
			var i = 0;
			for( i = 0; i < j; i++){
				if( most_selling[i] ){
					dtset[ i ] = [ most_selling[i].item_desc + ' ('+most_selling[i].units+')' , most_selling[i].total_amount ];
				}
			}
			
			var data = {
				id:'#chart1',
				dataset: dtset,
			};
			piechart( data );
		}
	}
	
	
});

$( document ).on( "pagecreate", "#records", function() {
	$('#popupRecords')
	.on( "popupafteropen", function( event, ui ) {
		if( $(this).data('key') ){
		
			var key = $(this).data('key');
			var sales_data = getData( key );
			
			var html = '';
			
			if( sales_data.inventory ){
				$.each( sales_data.inventory , function( k , s ){
					var inventory = getData( k );
					
					html += get_item_row_for_sales_records( s , inventory );
				});
				
				$(this)
				.find('#sales-record-sub-total')
				.html( formatNum(sales_data.subtotal.toFixed(2)) );
				
				$(this)
				.find('#sales-record-vat')
				.html( formatNum(sales_data.vat.toFixed(2)) );
				
				$(this)
				.find('#sales-record-total')
				.add( '#sales-record-total-1' )
				.html( formatNum(sales_data.total_amount.toFixed(2)) );
				
				var change = sales_data.total_amount_tendered - sales_data.total_amount;
				$(this)
				.find('#sales-record-change')
				.html( formatNum(change.toFixed(2)) );
				
				$(this)
				.find('#sales-record-amount-paid')
				.html( formatNum(sales_data.total_amount_tendered.toFixed(2)) );
				
				//sales-record-discount
				
			}else{
				//display no inventory msg
			}
			
		}else{
			//invalid sales id msg
		}
		
		$('#sales-record-pop-container')
		.html( html );
	});
	
	$('.sales-records-details-toggle')
	.on('click', function(){
		$('tfoot.details-hide')
		.removeClass('details-hide');
		
		$(this)
		.parents('tfoot')
		.addClass('details-hide');
	});
});

function get_item_row_for_sales_records_summary( s ){
	return '<tr><td><b>'+s.label+'</b></td><td><b>'+s.value+'</b></td></tr>';
};

function get_item_row_for_sales_records( s , v ){
	var a = s.unit_ordered*s.unit_selling_price;
	
	return '<tr><td>'+v.item_desc+'<b>&nbsp;('+s.unit_ordered+')</b></td><td><b>'+formatNum(a.toFixed(2))+'</b></td></tr>';
};

$( document ).on( "pageshow", "#records", function() {
	
	var sales = get_sales();
	var total_value = 0;
	var total_items = 0;
	var total_cost_price = 0;
	var total_vat = 0;
	
	var date = new Date();
	var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
	var this_month = date.getFullYear() + '-' + (date.getMonth() + 1);
	var this_year = date.getFullYear();
	var this_week = date.getDay();
	
	var current_timestamp = date.getTime();
	var one_day = current_timestamp - (24*3600);
	var two_day = current_timestamp - (48*3600);
		
	var today_html_days = '';
	var today_html_months = '';
	var today_html_years = '';
	
	var one_day_html = '';
	var two_day_html = '';
	
	var one_day_total = 0;
	var two_day_total = 0;
	
	var today_total_days = 0;
	var today_total_months = 0;
	var today_total_years = 0;
	
	var weekdays = new Array();
	weekdays = [ 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat' ];
	
	$.each( sales , function( key , value ){
		var date = new Date(value.timestamp);
		// hours part from the timestamp
		var day = date.getDate();
		var month = date.getMonth() + 1;
		var year = date.getFullYear();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		
		value.day_only = day;
		value.week_day = weekdays[ date.getDay() ];
		
		value.day = year + '-' + month + '-' + day;
		value.time = hours + ':' + minutes;
		
		if( value.day == today ){
			today_html_days += get_sales_records_html( value , 0 );
			today_total_days += parseFloat( value.total_amount );
		}
		
		if( value.timestamp < current_timestamp && value.timestamp > one_day ){
			one_day_html += get_sales_records_html( value , 0 );
			one_day_total += parseFloat( value.total_amount );
		}
		
		if( value.timestamp < one_day && value.timestamp > two_day ){
			two_day_html += get_sales_records_html( value , 1 );
			two_day_total += parseFloat( value.total_amount );
		}
		
		if( this_month == year + '-' + month ){
			today_html_months += get_sales_records_html( value , 1 );
			today_total_months += parseFloat( value.total_amount );
		}
		
	});
	
	$('#today-sales-records-days-total')
	.html( appCurrency + formatNum( today_total_days.toFixed(2) ) );
	
	$('#today-sales-records-months-total')
	.html( appCurrency + formatNum( today_total_months.toFixed(2) ) );
	
	$('#two-day-sales-total')
	.html( appCurrency + formatNum( two_day_total.toFixed(2) ) );
	
	$('#one-day-sales-total')
	.html( appCurrency + formatNum( one_day_total.toFixed(2) ) );
	
	if( one_day_html ){
		$('#one-day-sales-total')
		.html( '<ul data-role="listview" >'+one_day_html+'</ul>' )
		.trigger('create');
	}
	
	if( two_day_html ){
		$('#two-day-sales-total')
		.html( '<ul data-role="listview" >'+two_day_html+'</ul>' )
		.trigger('create');
	}
	
	$('#today-sales-records-months')
	.html( '<ul data-role="listview" >'+today_html_months+'</ul>' )
	.trigger('create');
	
	$('#today-sales-records')
	.html( '<ul data-role="listview" >'+today_html_days +'</ul>')
	.trigger('create');
	
	$('#sales-records-container')
	.find('a.sales-reccord')
	.on('click', function(e){
		e.preventDefault();
		
		$('#popupRecords')
		.data( 'key' , $(this).attr('key') )
		.popup('open');
	});
	
});

function get_sales_records_html( data , format ){
	var date = '';
	if( format ){
		date = data.day_only+'/'+data.week_day+' ';
	}
	return '<li><a href="#" key="'+data.key+'" class="sales-reccord" style="font-weight: normal;">#'+data.key+' @ '+date+data.time+' <b>'+ formatNum( data.total_amount.toFixed(2) ) +'</b></a></li>';
};

function update_suppliers_list_on_suppliers_page(){
	var suppliers = get_list_of_suppliers();
	var html = '';
	var html2 = '<option value="new">Add New Supplier</option>';
	
	$.each( suppliers , function( key , value ){
		html += get_supplier_html( key , value );
		html2 += '<option value="'+key+'">'+value.supplier+' ('+value.location+')</option>';
	});
	
	$( '#suppliers-list-container' )
	.html( html )
	.find('tr')
	.tsort({attr:'timestamp', order:'desc'});
	
	$('select[name="supplier"]')
	.html( html2 );
	/*
	.prev('span')
	.text( $('select[name="supplier"]').find('option:first').text() );*/
	
	$('select[name="supplier"]')
	.find('option')
	.tsort();
};

$( document ).on( "pagecreate", "#signup", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			$.mobile.navigate( "#viewAndModifyUserDetails-page", { transition : "none" });
		}else{
			//bind events handlers
			handle_form_submission( $('form#sign-up-form') );
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#supplier", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#suppliers-form') );
			
			//Display List of Suppliers
			update_suppliers_list_on_suppliers_page();
			
			$('#supplier-select-box')
			.on('change', function(){
				var val = $(this).val();
				if( val && val != 'new' ){
					var supplier = getData( val );
					
					$.each( supplier, function(key , value ){
						$('form#suppliers-form')
						.find('#'+key+'-field')
						.val( value );
					});
					
					$('#suppliers-form #mobile-field').blur();
					$( '#suppliers-form #email-field' ).blur();
					
					var total_amount_paid = 0;
					var total_amount_owed = 0;
					//recent supply activity
					var html = '';
					if( supplier.stock ){
						$.each( supplier.stock , function( k , v ){
							var stock = getData( k );
							var item = getData( stock.item_barcode );
							stock.item_desc = item.item_desc;
							html += get_last_supply_activity_html( stock );
							
							total_amount_owed += parseFloat( stock.amount_owed );
							total_amount_paid += parseFloat( stock.amount_paid );
						});
					}
					
					if( ! total_amount_owed )total_amount_owed = 0;
					
					$('#supplier-amount-owed')
					.val( $('#supplier-amount-owed').attr('placeholder') + formatNum( total_amount_owed.toFixed(2) ) );
					
					$('#last-supply-activity-supplier-name')
					.html( supplier.supplier );
					
					$('#last-supply-activity-container')
					.html( html )
					.find('.sort-record')
					.tsort({attr:'timestamp', order:'desc'});
					
				}else{
					$('form#suppliers-form')
					.reset();
				}
			});
			
			
			$('#suppliers-form #mobile-field')
			.add( '#suppliers-form #email-field' )
			.on('blur', function(){
				$('#'+$(this).attr('id')+'-link')
				.attr('href', $(this).attr('protocol')+$(this).val() );
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pagecreate", "#settings", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#sign-up-form') );
			
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#settings", function() {
	//check for registered user details
	var userInfo = get_user_info();
	
	$.each( userInfo , function( k , v ){
		switch( k ){
		default:
			$('form#sign-up-form')
			.find('#'+k+'-field')
			.val( v );
		break;
		}
	} );
	
});

function get_last_supply_activity_html( stock ){
	var date = new Date(stock.creationtimestamp);
	// hours part from the timestamp
	var day = date.getDate();
	var month = date.getMonth() + 1;
	var year = date.getFullYear();
	stock.date = day + '-' + month + '-' + year;
	
	return '<div class="ui-grid-b sort-record" timestamp="'+stock.creationtimestamp+'"><div class="ui-block-a" style="padding:0.5em;"><label style="color: white; text-shadow: none; ">'+stock.item_desc+'</label></div><div class="ui-block-b" style="padding:0.5em;"><label style="color: white; text-shadow: none; ">'+stock.item_qty+'</label></div><div class="ui-block-c" style="padding:0.5em;"><label style="color: white; text-shadow: none; ">'+stock.date+'</label></div></div>';
	
};

$( document ).on( "pagecreate", "#newInventory", function() {
	
	$('#button-scan')
	.on('click', function(){
		cordova.plugins.barcodeScanner.scan(
		  function (result) {
			 $('form#inventory-form')
			.find( 'input#item_barcode-field' )
			.val( result.text );
			
			 alert("We got a barcode\n" +
					"Result: " + result.text + "\n" +
					"Format: " + result.format + "\n" );
					
			
		  }, 
		  function (error) {
			  alert("Scanning failed: " + error);
		  }
	   );
	});
	
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#inventory-form') );
			
			$('form#inventory-form')
			.find('#selling_price-field')
			.add( 'form#inventory-form #cost_price-field' )
			.on('change', function(){
				var cp = parseFloat( $('form#inventory-form #cost_price-field').val() );
				var sp = parseFloat( $('form#inventory-form #selling_price-field').val() );
				
				if( ! cp )cp = 0;
				
				var m = 0;
				if( sp )m = ( ( sp - cp ) / sp ) * 100;
				
				$('#inventory-gross-margin').text( m.toFixed(1) + '%' );
				
				switch( $(this).attr('id') ){
				case 'cost_price-field':
					var q = parseFloat( $('form#inventory-form #item_qty-field').val() );
					var tcp = cp * q;
					
					if( ! tcp )tcp = 0;
					
					$('form#inventory-form #dummy-totalCostPrice').val( $('form#inventory-form #dummy-totalCostPrice').attr('placeholder')+formatNum( tcp.toFixed(2) ) );
				break;
				}
			})
			.on('keyup', function(){
				$(this).change();
			});
			
			$('form#inventory-form')
			.find('#amount_paid-field')
			.on('change', function(){
				var ap = parseFloat( $(this).val() );
				
				var q = parseFloat( $('form#inventory-form #item_qty-field').val() );
				var cp = parseFloat( $('form#inventory-form #cost_price-field').val() );
				
				var tcp = cp * q;
					
				if( ! tcp )tcp = 0;
				if( ! ap )ap = 0;
				
				var ao = tcp - ap;
				
				$('form#inventory-form #amount_owed-field').val( ao );
				$('form#inventory-form #dummy-amntOwed').val( $('form#inventory-form #dummy-amntOwed').attr('placeholder')+formatNum( ao.toFixed(2) ) );
			})
			.on('keyup', function(){
				$(this).change();
			});
			
			$('#new-inventory-finish-button')
			.on('click', function(e){
				e.preventDefault();
				
				$('form#inventory-form').submit();
				
				$.mobile.navigate( "#confirmation", { transition : "none" });
			});
			
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#newInventory", function() {
	populate_suppliers_select_box( $('#inventory-form').find('select[name="supplier"]') );
});

$( document ).on( "pageshow", "#confirmation", function() {
	var t = storeObjects[ 'total_newly_listed_inventory' ];
	if( ! t )t = 0;
	
	$('#newly-added-inventory-total')
	.html( appCurrency + formatNum(t.toFixed(2)) );
	/*
	$('#newly-listed-inventory-container')
	.html('');
	*/
});

function populate_suppliers_select_box( $element ){
	//Update Suppliers Combo
	var suppliers = get_list_of_suppliers();
	var html = '<option>Select Supplier</option>';
	$.each( suppliers , function( key , value ){
		html += '<option value="'+key+'">'+value.supplier+' ('+value.location+')</option>';
	});
	
	if( html ){
		$element
		.html( html );
	}
};

$( document ).on( "pagecreate", "#stockLevels", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			$('select#filter-location-field')
			.add('select#filter-category-field')
			.on('change', function(){
				
				var c1 = '.'+$('select#filter-location-field').val().replace(' ','-');
				var c2 = '.'+$('select#filter-category-field').val().replace(' ','-');
				
				$('#stockLevels-container')
				.find('tr')
				.show();
				
				if( c1.length > 2 ){
					$('#stockLevels-container')
					.find('tr')
					.not(c1)
					.hide();
				}
				
				if( c2.length > 2 ){
					$('#stockLevels-container')
					.find('tr')
					.not(c2)
					.hide();
				}
				
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
	
});

$( document ).on( "pageshow", "#stockLevels", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '';
	$.each( inventory , function( key , value ){
		html += get_inventory_html( key , value );
	});
	
	if( html ){
		$('#stockLevels-container')
		.html( html )
		.find('tr')
		.tsort();
	}
});

$( document ).on( "pagecreate", "#restock", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//registered
			handle_form_submission( $('form#stock-form') );
			
			$('select[name="item_barcode"]')
			.on('change' , function(){
				if( $(this).val() ){
					var key = $(this).val();
					var inventory = get_list_of_inventory();
					
					var $form = $(this).parents('form');
					
					if( inventory[key] ){
						$.each( inventory[key] , function( k , v ){
							switch( k ){
							case 'item_barcode': case 'category': case 'item_qty': case 'amount_paid': case 'total_cost_price': case 'key':
							break;
							default:
								$form
								.find('#'+k+'-field')
								.val( v );
							break;
							}
						} );
					}
				}
			});
			
			$('#stock-form select#filter-location-field')
			.add('#stock-form select#filter-category-field')
			.on('change', function(){
				
				var c1 = '.'+$('#stock-form select#filter-location-field').val().replace(' ','-');
				var c2 = '.'+$('#stock-form select#filter-category-field').val().replace(' ','-');
				
				$('#stock-form')
				.find('select[name="item_barcode"]')
				.find('option')
				.show();
				
				if( c1.length > 2 ){
					$('#stock-form')
					.find('select[name="item_barcode"]')
					.find('option')
					.not(c2)
					.hide();
				}
				
				if( c2.length > 2 ){
					$('#stock-form')
					.find('select[name="item_barcode"]')
					.find('option')
					.not(c2)
					.hide();
				}
				
			});
			
			$('form#stock-form')
			.add( 'form#stock-form #cost_price-field' )
			.on('change', function(){
				var cp = parseFloat( $('form#stock-form #cost_price-field').val() );
				
				if( ! cp )cp = 0;
				
				var q = parseFloat( $('form#stock-form #item_qty-field').val() );
				var tcp = cp * q;
				
				if( ! tcp )tcp = 0;
				
				$('form#stock-form #dummy-totalCostPrice').val( $('form#stock-form #dummy-totalCostPrice').attr('placeholder') + formatNum( tcp.toFixed(2) ) );
			})
			.on('keyup', function(){
				$(this).change();
			});
			
			$('form#stock-form')
			.find('#amount_paid-field')
			.on('change', function(){
				var ap = parseFloat( $(this).val() );
				
				var q = parseFloat( $('form#stock-form #item_qty-field').val() );
				var cp = parseFloat( $('form#stock-form #cost_price-field').val() );
				
				var tcp = cp * q;
					
				if( ! tcp )tcp = 0;
				if( ! ap )ap = 0;
				
				var ao = tcp - ap;
				
				$('form#stock-form #amount_owed-field').val( ao );
				$('form#stock-form #dummy-amntOwed').val( $('form#stock-form #dummy-amntOwed').attr('placeholder')+formatNum( ao.toFixed(2) ) );
			})
			.on('keyup', function(){
				$(this).change();
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
	
});

var low_stock_level = 25;

$( document ).on( "pageshow", "#inventory", function() {
	var userInfo = get_user_info();
	if( userInfo.low_stock_level ){
		low_stock_level = parseInt( userInfo.low_stock_level );
	}
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	
	var label = new Array();
	var values = new Array();
	var i = 0;
	
	var total_value = 0;
	var total_items = 0;
	
	var html = '';
	
	$.each( inventory , function( key , value ){
		if( ! value.item_sold )value.item_sold = 0;
		
		label[i] = value.item_desc;
		
		values[i] = ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
			
		total_value += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) )* value.selling_price;
		total_items += ( parseFloat( value.item_qty ) - parseFloat( value.item_sold ) );
		
		++i;
		
		html += get_inventory_level_html( value , i );
	});
	
	$('#inventory-levels-container')
	.html( html )
	.find('.sort-element')
	.tsort({attr:'stock', order:'asc'});
	
	$('.total-value-of-inventory')
	.html( appCurrency + formatNum(total_value.toFixed(2) ) );
	
	$('.total-items-in-stock')
	.html( formatNum( total_items ) );
	
	if( label && values && i ){
		var data = {};
		data.label = label;
		data.value = values;
		data.id = 'chart6';
		data.axislabel = new Array();
		data.axislabel[0] = {label:'Remaining Stock'};
		activate_bar_chart( data );
	}
});

function get_inventory_level_html( value , i ){
	
	var units = parseFloat( value.item_qty ) - parseFloat( value.item_sold );
	var stclass = 'stcklvl';
	
	if( units < low_stock_level ){
		var stclass = 'stcklow';
	}
	return '<div class="sort-element ui-block-c" stock="'+units+'"><div class="ui-bar ui-bar-a" style="height:65px;">'+value.item_desc+'<span class="'+stclass+'">' + units +'</span></div></div>';
};

$( document ).on( "pageshow", "#restock", function() {
	
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '<option>Select Item</option>';
	$.each( inventory , function( key , value ){
		html += '<option value="'+key+'" class="'+value.category.replace(' ', '-')+' '+value.location.replace(' ', '-')+'">'+value.item_desc+'</option>';
	});
	
	if( html ){
		$('#stock-form')
		.find('select[name="item_barcode"]')
		.html( html );
	}
	
	populate_suppliers_select_box( $('#stock-form').find('select[name="supplier"]') );
});

var default_vat_value = 5;
var add_vat_to_sale = default_vat_value;

var default_discount_value = 10;
var add_discount_to_sale = 0;

$( document ).on( "pagecreate", "#sales", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			//$('#amount_tendered-field').focus().select();
			$('#vat-on-off-switch')
			.on('change', function(){
				
				if( add_vat_to_sale )add_vat_to_sale = 0;
				else add_vat_to_sale = default_vat_value;
				
				calculate_total_sales();
			});
			
			$('#discount-on-off-switch')
			.on('change', function(){
				
				if( add_discount_to_sale )add_discount_to_sale = 0;
				else add_discount_to_sale = default_discount_value;
				
				calculate_total_sales();
			});
			
			//registered
			$('#confirm-this-sale-button')
			.on( 'click', function(){
				if( $('#amount_tendered-field').val() ){
					 var data = {};
					 var items = {};
					 
					 $('#sales-table-body')
					 .find('tr.item-for-sale')
					 .each(function(){
						var key = parseFloat( $(this).attr('id') );
						items[ key ] = {
							key: key,
							unit_selling_price: parseFloat( $(this).attr('unit-price') ),
							unit_ordered: parseFloat( $(this).find('input[type="number"]').val() ),
						};
						
					 });
					 
					 if( data && $('#sales-table-body').attr('total') ){
						data.object = 'sales';
						data.error = false;
						data.inventory = items;
						data.total_amount = parseFloat( $('#sales-table-body').attr('total') );
						data.total_amount_tendered = parseFloat( $('#amount_tendered-field').val() );
						data.total_units = parseFloat( $('#sales-table-body').attr('units') );
						data.vat = parseFloat( $('#sales-table-body').attr('vat') );
						data.discount = parseFloat( $('#sales-table-body').attr('discount') );
						data.subtotal = parseFloat( $('#sales-table-body').attr('subtotal') );
						data.total_cost_price = parseFloat( $('#sales-table-body').attr('total_cost_price') );
						
						var stored = store_record( data );
						successful_submit_action( stored );
						
						$('#confirm-this-sale-popup')
						.popup("close");
						
						$('#sales-table-body')
						.find('tr.item-for-sale')
						.remove();
						
						calculate_total_sales();
						
						$('#this-sale-change').val('');
					 }
				}else{
					var settings = {
						message_title:'Invalid Amount',
						message_message: 'Please enter the amount tendered',
						auto_close: 'yes'
					};
					display_popup_notice( settings );
				}
			});
			
			$('#amount_tendered-field')
			.on( 'change' , function(){
				var change = parseFloat( $(this).val() ) -  parseFloat( $('#sales-table-body').attr('total') );
				
				$('#this-sale-change')
				.html( appCurrency + formatNum( change.toFixed(2) ) );
			})
			.on('keyup', function(){
				$(this).change();
			});
			
			$('#confirm-this-sale-popup-display-button')
			.on( 'click', function(){
				if( $('#sales-table-body').find('tr.item-for-sale').length > 0 ){
					return true;
				}
				var settings = {
					message_title:'Empty Cart',
					message_message: 'Please add item(s) to your cart',
					auto_close: 'yes'
				};
				display_popup_notice( settings );
				
				return false;
			});
			
			$('#cancel-order-button')
			.on( 'click', function(){
				
				$('#sales-table-body')
				.find('tr')
				.remove();
				
				calculate_total_sales();
				
				$('#this-sale-change').val('');
				
			});
		}else{
			//bind events handlers
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

$( document ).on( "pageshow", "#sales", function() {
	
	var userInfo = get_user_info();
	if( userInfo.vat ){
		default_vat_value = parseFloat( userInfo.vat );
	}
	
	if( userInfo.discount ){
		default_discount_value = parseFloat(userInfo.discount);
	}
		
	//Update inventory list
	var inventory = get_list_of_inventory();
	var html = '';
	$.each( inventory , function( key , value ){
		if( value.item_qty )
			html += '<li><a href="#" key="'+key+'" max-qty="'+value.item_qty+'" selling-price="'+value.selling_price+'" cost-price="'+value.cost_price+'">'+value.item_desc+'</a></li>';
	});
	
	if( html ){
		$('#sales-inventory-list-container')
		.html( '<ul data-role="listview" data-filter="true" data-filter-reveal="true" data-filter-placeholder="Scan/Search Product" id="sales-inventory-list">' + html + '</ul>' )
		.trigger('create');
		
		$('#sales-inventory-list')
		.find('a')
		.on('click', function(e){
			e.preventDefault();
			
			var amount = parseFloat( $(this).attr('selling-price') );
			var cost = parseFloat( $(this).attr('cost-price') );
			var $item = $('#sales-table-body').find('tr#'+$(this).attr('key') );
			
			var units = 0;
			
			if( $item && $item.is(':visible') ){
				var $input = $item.find( 'input' );
				if( $input.attr('max') && parseFloat( $input.val() ) < parseFloat( $input.attr('max') ) ){
					units = parseFloat( $input.val() ) + 1;
					
					$input.val( units );
					
					amount *= units;
					
					$item
					.find('td.price')
					.attr('total', amount )
					.attr('units', units )
					.find('.price-val')
					.html( formatNum( amount.toFixed(2) ) );
				}
			}else{
				$('#sales-table-body')
				.prepend( '<tr id="'+$(this).attr('key')+'" unit-price="'+amount+'" cost-price="'+cost+'" class="item-for-sale"><td class="label">'+$(this).text()+'</td><td class="input"><input type="number" min="1" step="1" max="'+$(this).attr('max-qty')+'" value="1" /></td><td class="price" total="'+amount+'" units="1"><span class="price-val">' + formatNum( amount.toFixed(2) ) + '</span><a href="#" class="ui-btn ui-btn-inline ui-icon-minus ui-btn-icon-notext ui-theme-a">remove</a></td></tr>' );
				
				$('#sales-table-body')
				.find('tr#'+$(this).attr('key')+' input[type="number"]' )
				.bind('change', function(){
					var $tr = $(this).parents('tr');
					
					var amount = parseFloat( $tr.attr('unit-price') );
					
					var units = parseFloat( $(this).val() );
					amount *= units;
					
					$tr
					.find('td.price')
					.attr('total', amount )
					.attr('units', units )
					.find('.price-val')
					.html( formatNum( amount.toFixed(2) ) );
					
					calculate_total_sales();
				});
				
				$('#sales-table-body')
				.find('tr a' )
				.bind('click', function(){
					$(this).parents('tr').remove();
					calculate_total_sales();
				});
				
				/*
				$('#sales-table-body')
				.find('tr')
				.on( "swipeleft", function(e){
					$(this)
					.find('a')
					.fadeIn();
				})
				.on( "swiperight", function(e){
					$(this)
					.find('a')
					.fadeOut();
				});
				*/
				units = 1;
			}
			
			if( units ){
				calculate_total_sales();
			}
			
		});
	}
	
});

function calculate_total_sales(){
	if( $('#sales-table-body') ){
		var total_price = 0;
		var total_units = 0;
		var total_cost_price = 0;
		
		$('#sales-table-body')
		.find('.item-for-sale')
		.each(function(){
			total_price += parseFloat( $(this).find('td.price').attr('total') );
			total_units += parseFloat( $(this).find('td.price').attr('units') );
			total_cost_price += parseFloat( $(this).attr('cost-price') ) * parseFloat( $(this).find('td.price').attr('units') );
		});
		
		var vat = 0;
		if( total_price )vat = total_price * add_vat_to_sale / 100;
		
		$('#this-sale-total-amount-vat')
		.html( formatNum( vat.toFixed(2) ) );
		
		$('#this-sale-subtotal-amount')
		.html( formatNum( total_price.toFixed(2) ) );
		
		var total = total_price + vat;
		
		var discount = 0;
		if( total ){
			discount = total * add_discount_to_sale / 100;
			
			var dt = total;
			$('#this-sale-total-amount-discount')
			.html( formatNum( discount.toFixed(2) ) + ' from ' + formatNum( dt.toFixed(2) )  );
			
			total -=  discount;
		}else{
			$('#this-sale-total-amount-discount')
			.html( '0.00' );
		}
		
		$('#sales-table-body')
		.attr({
			total: total,
			vat: vat,
			discount: discount,
			subtotal: total_price,
			units: total_units,
			total_cost_price: total_cost_price,
		});
		
		$('#this-sale-total-amount')
		.html( formatNum( total.toFixed(2) ) );
		
		$('#amount_tendered-field').val( $('#this-sale-total-amount').text() );
		$('#this-sale-checkout-total').html( 'Total &rarr; ' + appCurrency + $('#this-sale-total-amount').text() );
	}
};

$( document ).on( "pagecreate", "#viewAndModifyUserDetails-page", function() {
	if( customUUID ){
		
		//check for registered user details
		var userInfo = get_user_info();
		if( userInfo ){
			var html = '';
			$.each( userInfo , function( key , value ){
				switch( key ){
				case 'error': case 'object': case 'password': case 'cemail':
				break;
				default:
					html += '<div class="user-info user-info-'+key+'"><label>'+key+'</label><div>'+value+'</div>';
				break;
				}
			});
			
			//registered
			$('#user-details-container')
			.html( html );
			
			//bind form submit event handler
		}else{
			$.mobile.navigate( "#signup", { transition : "none" });
		}
		
	}else{
		cannot_initiate_app();
	}
});

var storeObject = {
    
}

var appCurrency = '&#8358;';

var appLoadCount = 0;

var appLoad = true;

var videosLoad = true;

var appShowLoadingAnimation = false;

var activePage = true;

var tempCategoryHTML = new Array();

var storeBusinesses = new Array();

var activeBusinessView = 'all';

var firstBusinessID = new Array();
var lastBusinessID = new Array();
var currentIterationBusinessID = new Array();

var refreshBusinessListing = new Array();

var requestRetryCount = 0;

//var pagepointer = 'http://localhost/sabali/control/';
//var pagepointer = 'http://192.168.1.4/sabali/control/';
var pagepointer = 'http://app.kobokong.com/';

var form_method = 'get';
var ajax_data_type = 'json';
var ajax_data = '';
var ajax_get_url = '';
var ajax_action = '';
var ajax_container;
var ajax_notice_container;
var ajax_request_md5_key = '';

//AJAX Request Data Before Sending
var ajax_request_data_before_sending_to_server = '';

var function_click_process = 1;

var cancel_ajax_recursive_function = false;

//BUSINESS LISTINGS QUERY LIMITS
var business_limit_start = new Array();
var business_limit_interval = 20;

//SEARCH QUERY LIMITS
var search_condition = '';
var search_limit_start = 0;
var search_limit_interval = 20;

function clearSingleData( key ){
	amplify.store( key , null );
};
	
function clearData(){
	var storedObjects = amplify.store();
	
	//console.log('all',  storedObjects );
	//ga('send', 'pageview', {'page': '/user-triggered-refresh' , 'title': 'User Refreshed App' });
	
	$.each( storedObjects , function ( key , value ){
		switch( key ){
		case 'custom-uuid':
		break;
		default:
			amplify.store( key , null );
		break;
		}
	});
};

function putData( key , value ){
	return amplify.store( key , value );
};

function getData( key ){
	return amplify.store( key );
};

function get_dynamic_categories(){
	ajax_data = {action:'categories', todo:'get_dynamic_categories'};
	form_method = 'get';
	ajax_data_type = 'json';
	ajax_action = 'request_function_output';
	ajax_container = $('#login-form');
	ajax_send();
	
};

function get_active_page_id(){
	var active_page = $( "body" ).pagecontainer( "getActivePage" );
	var active_page_id = active_page.context.location.hash;
	
	if( active_page_id ){
		active_page_id = active_page_id.replace('#', '');
	}
	
	return active_page_id;
};

function ajax_send(){
	
	if(function_click_process){
	//Send Data to Server
	$.ajax({
		dataType:ajax_data_type,
		type:form_method,
		data:ajax_data,
		url: pagepointer+'php/app_request_processor.php'+ajax_get_url,
		timeout:30000,
		beforeSend:function(){
			//Display Loading Gif
			function_click_process = 0;
			
			cancel_ajax_recursive_function = false;
			
			confirm_action_prompt = 0;
			
			/*ajax_container.html('<div id="loading-gif" class="no-print">Please Wait</div>');*/
			
			$('div.progress-bar-container')
			.html('<div id="virtual-progress-bar"><div class="progress-bar"></div></div>');
			
			progress_bar_change();
			
			ajax_request_md5_key = '';
			ajax_request_md5_key += ajax_data_type + form_method + pagepointer + ajax_get_url;
			if( typeof(ajax_data) == "object" )
				ajax_request_md5_key += $.param( ajax_data );
			else
				ajax_request_md5_key += ajax_data;
			
			/*CHECK FOR LOCALLY STORED DATA*/
			ajax_request_md5_key = md5( ajax_request_md5_key );
			
			var storedData = getData( ajax_request_md5_key );
			
			if( storedData ){
				if( ! ( storedData.expiry_time && storedData.expiry_time > 60000 && storedData.expiry_time < Date.now() ) ){
					ajaxSuccess( storedData , false );
					return false;
				}
			}
		},
		error: function(event, request, settings, ex) {
			ajaxError( event, request, settings, ex );
		},
		success: function(data){
			ajaxSuccess( data , true );
		}
	});
	}
};

function ajaxError( event, request, settings, ex ){
	if( $('#app-loading-animation-id').is(':visible') ){
		$('#app-loading-animation-id')
		.hide();
		
		if( $("#home-page-example-wrapper") && $("#home-page-example-wrapper").hasClass('iscroll-wrapper') ){
			$("#home-page-example-wrapper").iscrollview("refresh");
		}
	}
};

function ajaxSuccess( data , store ){
	/*store data in local storage*/
	if( $('#app-loading-animation-id').is(':visible') ){
		$('#app-loading-animation-id')
		.hide();
		
		if( $("#home-page-example-wrapper") && $("#home-page-example-wrapper").hasClass('iscroll-wrapper') ){
			$("#home-page-example-wrapper").iscrollview("refresh");
		}
	}
	
	if( data && store ){
		//Set Expiry Time
		data.expiry_time = Date.now() + 18000000;	//5 hours
		putData( ajax_request_md5_key , data );
	}
	
	requestRetryCount = 0;
	
	function_click_process = 1;
	
	if( storeObject.begin_search ){
		storeObject.begin_search = false;
		/*remove searching animation*/
		
	}
	
	switch(ajax_action){
	case "request_function_output":
		ajax_request_function_output(data);
	break;
	}
	
	//CHECK FOR NOTIFICATION
	if(data.notification){
		check_for_and_display_notifications(data.notification);
	}
};

function ajax_request_function_output(data){
	//alert(data);
	//Close Pop-up Menu
	if( data.status ){
		switch(data.status){
		case "get-dynamic-categories":
			//Transform Data to HTML Markup
			if( data.html ){
				var show_more = false;
				
				var html_more = '<div data-role="collapsible">';
				html_more += '<h2><span class="con-image-left more-categories">More Categories</span></h2>';
				html_more += '<div data-role="collapsible-set" data-theme="g" data-content-theme="a"  data-collapsed-icon="carat-r" data-expanded-icon="carat-d" style="margin:0 -0.5em;">';
				
				var html = '<div id="app-main-menu" data-role="collapsible-set" data-theme="g" data-content-theme="a" data-collapsed-icon="carat-r" data-expanded-icon="carat-d">';
				$.each(data.html, function(key, value){
					
					var temp = '';
					var icon = 'default-con';
					
					if( value.icon )
						icon = value.icon + '-con';
						
					temp += '<div data-role="collapsible" data-iconpos="right">';
						temp += '<h2><span class="con-image-left '+icon+'">'+value.title+'</span></h2>';
						temp += '<ul data-role="listview">';
					
					if( value.sublevels ){
						$.each(value.sublevels, function(ki, vi){
							temp += '<li><a href="#" data-ajax="false" id="'+ki+'" class="category-navigation-menu">'+vi.title+'</a></li>';
							
							refreshBusinessListing[ ki ] = true;
							storeBusinesses[ ki ] = new Array();
							
							business_limit_start[ ki ] = 0;
						});
					}
					
						temp += '</ul>';
					temp += '</div>';
					
					switch( value.type ){
					case '100':
						html += temp;
					break;
					case '150':
						html_more += temp;
						
						show_more = true;
					break;
					}
				});
				
				if( show_more ){
					html += html_more + '</div>';
				}
				
				html += '</div>';
				
				if( data.videos_playlist ){
					
					storeObject.videos_playlist = data.videos_playlist;
					
				}
				
				//html += '<li data-icon="info" class="ui-alt-icon"><a href="tutorial.html" rel="external">How to Use Koboko</a></li>';
				//html += '<li data-icon="info" class="ui-alt-icon"><a href="#about">About</a></li>';
			}
			
			//Store HTML in Client Storage
			
			//Insert HTMl into respective position
			
			$('#navigation-menu')
			.html( html )
			.trigger('create');
			
			//Initialize to jQuery Mobile Controls
			
			/*Bind Actions if Any*/
			$('#navigation-menu')
			.find('h2 > a')
			.on('click', function(){
				//alert(1);
				$("#categories-page-example-wrapper").iscrollview("refresh");
			});
			
			/*Initialize Refresh Commands*/
			refreshBusinessListing[ 'all' ] = true;
			refreshBusinessListing[ 'search_results' ] = true;
			refreshBusinessListing[ 'advert' ] = true;
			
			business_limit_start[ 'all' ] = 0;
			business_limit_start[ 'advert' ] = 0;
			
			storeBusinesses[ 'advert' ] = new Array();
			storeBusinesses[ 'all' ] = new Array();
			storeBusinesses[ 'search_results' ] = new Array();
			
			bind_main_menu_click_events();
			
			/*Load Initial Adverts*/
			get_adverts();
			
		break;
		case "get-videos":
			/*Transform Data to HTML Markup*/
			if( data.html.videos && data.html.videos.season ){
				var html = '<ul data-role="listview" data-inset="true" data-shadow="false" data-corners="false">';
				
				$.each(data.html.videos.season, function(key, value){
					
					html += '<li data-role="collapsible" data-iconpos="right" data-inset="false">';
						html += '<h2 class="season-title">'+value.season_title+'</h2>';
						html += '<ul data-role="listview" data-theme="a" data-count-theme="g">';
					
					var current_season_id = value.season_id;
					
					$.each( value.season_videos , function(ki, vi){
						html += '<li><a href="#" data-ajax="false" class="videos-link" id="'+ki+'" youtube-link="'+vi.youtube_link+'" title="'+vi.title+'">'+vi.title;
							if( ki == data.html.videos.latest_video ){
								html += '<span class="ui-li-count">new</span>';
							}
						html += '</a></li>';
					});
					
						html += '</ul>';
					html += '</li>';
					
				});
				
				html += '</ul>';
			}
			
			/*Store HTML in Client Storage*/
			
			$('#video-series-container')
			.html( html )
			.trigger('create');
			
			$("#mallam-musa-example-wrapper").iscrollview("refresh");
			
			$('#video-series-container')
			.find('a.videos-link')
			.bind('click', function(){
				
				$('iframe#player')
				.attr('src' , $(this).attr('youtube-link')+'?rel=0' );
				ga('send', 'pageview', {'page': '/mallam-musa' , 'title': $(this).attr('title') });
				
			});
			
			videosLoad = false;
			
		break;
		case "get-adverts":
			if( data.html.advert ){
				
				var html = '';
				
				var idOfLastBusiness = '';
				var idOfFirstBusiness = '';
				
				currentIterationBusinessID[ 'advert' ] = '';
				
				//console.log('look', data.html.business);
				
				$.each(data.html.advert, function(key, value){
					
					html += prepare_advert_html( key , value , 'business-listing' );
					
					//First Dataset
					if(  ! value.prev_business_id ){
						idOfFirstBusiness = key;
					}
					
					//Last Dataset
					if(  ! value.next_business_id ){
						idOfLastBusiness = key;
					}
					
					storeBusinesses[ 'advert' ][key] = value;
					
				});
				
				//UPDATE THIS ITERATION FIRST BUSINESS ID
				currentIterationBusinessID[ 'advert' ] = idOfFirstBusiness;
				
				//SET FIRST BUSINESS ID
				if( ! ( firstBusinessID[ 'advert' ] ) ){
					firstBusinessID[ 'advert' ] = idOfFirstBusiness;
				}
				
				//UPDATE PREV BUSINESS ID OF FIRST BUSINESS
				storeBusinesses[ 'advert' ][ idOfFirstBusiness ].prev_business_id = idOfLastBusiness;
				
				//UPDATE NEXT BUSINESS ID OF LAST BUSINESS
				storeBusinesses[ 'advert' ][ idOfLastBusiness ].next_business_id = idOfFirstBusiness;
				
				//UPDATE NEXT ID OF LAST BUSINESS FOR PREVIOUS ITERATION
				if( currentIterationBusinessID[ 'advert' ] && lastBusinessID[ 'advert' ] ){
					
					storeBusinesses[ 'advert' ][ lastBusinessID[ 'advert' ] ].next_business_id = currentIterationBusinessID[ 'advert' ];
				}
				
				//UPDATE PREV ID OF FIRST BUSINESS FOR FIRST ITERATION
				if( firstBusinessID[ 'advert' ] && idOfLastBusiness ){
					storeBusinesses[ 'advert' ][ firstBusinessID[ 'advert' ] ].prev_business_id = idOfLastBusiness;
				}
				
				lastBusinessID[ 'advert' ] = idOfLastBusiness;
				
				if( data.html.limit_start ){
					business_limit_start[ 'advert' ] = data.html.limit_start;
				}
				
				if( html ){
					$( '#events-notification-container' )
					.prepend( html )
					.trigger( 'create' );
					
					$('#events-notification-container')
					.find('div.more-details-button')
					.show()
					.on('click', function(){
						$(this)
						.siblings('.events-notifications-content')
						.toggleClass('half-open-events-notifications');
						
						$('#events-notification-container')
						.find('div.more-details-button')
						.find('a')
						.toggleClass('ui-icon-plus')
						.toggleClass('ui-icon-minus');
					});
					
					$('#events-notification-container')
					.find('div.text-area')
					.on('click', function(){
					
						$('#advert-more-info-popup')
						.html( $(this).find('.advert-detail-info').html() )
						.popup("open");
					});
					
					$('#events-notification-container')
					.find('div.events-notifications-content')
					.find('img')
					.on('click', function(){
						
						$(this)
						.parents('li')
						.find('div.text-area')
						.click();
					});
					
					/*
					setTimeout(function(){
						$( '#events-notification-container' )
						.slidesjs({
							width:$( '#events-notification-container' ).width(),
							height:$( '#events-notification-container' ).height(),
						});
						
						$( '#events-notification-container' )
						.css('overflow', 'auto' );
					}, 100 );
					*/
				}
				
			}else{
				refreshBusinessListing[ 'advert' ] = false;
			}
			
			if( appLoad ){
				//Load Initial Business Listings
				get_business_listings(); 
			}
		break;
		case "search-business-listings":
			activeBusinessView = 'search_results';
		case "get-business-listings":
			
			if( ! activeBusinessView )
				activeBusinessView = 'all';
			
			if( data.html.business ){
				
				var html = '';
				
				currentIterationBusinessID[ activeBusinessView ] = '';
				
				var idOfLastBusiness = '';
				var idOfFirstBusiness = '';
				
				//console.log('look', data.html.business);
				
				$.each(data.html.business, function(key, value){
					
					html += prepare_business_listing_html( key , value , 'business-listing' );
					
					//First Dataset
					if(  ! value.prev_business_id ){
						idOfFirstBusiness = key;
					}
					
					//Last Dataset
					if(  ! value.next_business_id ){
						idOfLastBusiness = key;
					}
					
					storeBusinesses[ activeBusinessView ][key] = value;
					
				});
				
				//UPDATE THIS ITERATION FIRST BUSINESS ID
				currentIterationBusinessID[ activeBusinessView ] = idOfFirstBusiness;
				
				//SET FIRST BUSINESS ID
				if( ! ( firstBusinessID[ activeBusinessView ] ) ){
					firstBusinessID[ activeBusinessView ] = idOfFirstBusiness;
				}
				
				//UPDATE PREV BUSINESS ID OF FIRST BUSINESS
				storeBusinesses[ activeBusinessView ][ idOfFirstBusiness ].prev_business_id = idOfLastBusiness;
				
				//UPDATE NEXT BUSINESS ID OF LAST BUSINESS
				storeBusinesses[ activeBusinessView ][ idOfLastBusiness ].next_business_id = idOfFirstBusiness;
				
				//UPDATE NEXT ID OF LAST BUSINESS FOR PREVIOUS ITERATION
				if( currentIterationBusinessID[ activeBusinessView ] && lastBusinessID[ activeBusinessView ] ){
					
					storeBusinesses[ activeBusinessView ][ lastBusinessID[ activeBusinessView ] ].next_business_id = currentIterationBusinessID[ activeBusinessView ];
				}else{
					//storeBusinesses[ activeBusinessView ][ idOfLastBusiness ].next_business_id = currentIterationBusinessID[ activeBusinessView ];
				}
				
				//UPDATE PREV ID OF FIRST BUSINESS FOR FIRST ITERATION
				if( firstBusinessID[ activeBusinessView ] && idOfLastBusiness ){
					storeBusinesses[ activeBusinessView ][ firstBusinessID[ activeBusinessView ] ].prev_business_id = idOfLastBusiness;
				}
				
				lastBusinessID[ activeBusinessView ] = idOfLastBusiness;
				
				/*console.log('last_id', lastBusinessID[ activeBusinessView ]);
				console.log( 'businesses' , storeBusinesses );*/
				
				if( data.html.limit_start ){
					switch( activeBusinessView ){
					case "search_results":
						search_limit_start = data.html.limit_start;
					break;
					default:
						business_limit_start[ activeBusinessView ] = data.html.limit_start;
					break;
					}
				}
				
				if( html ){
					switch( activeBusinessView ){
					case "all":
						$( '#businesses-container' )
						.append( '<ul data-role="listview" data-split-icon="star" data-split-theme="a" data-inset="false">' + html + '</ul>' )
						.trigger('create');
						
						//if( ! appLoad )
							//$(".example-wrapper").iscrollview("refresh");
					break;
					case "search_results":
						if( $('#searching-gif-container') ){
							$('#searching-gif-container').remove();
						}
						
						$( '#search-results-container' )
						.append( '<ul data-role="listview" data-split-icon="star" data-split-theme="a" data-inset="false">' + html + '</ul>' )
						.trigger('create');
						
						//if( $(".example-wrapper").is(':visible') && ! appLoad ){
							//$(".example-wrapper").iscrollview("refresh");
						//}
					break;
					default:
						if( $('#category-gif-container') ){
							$('#category-gif-container').remove();
						}
						
						if( tempCategoryHTML[ activeBusinessView ] )
							tempCategoryHTML[ activeBusinessView ] += html;
						else
							tempCategoryHTML[ activeBusinessView ] = html;
							
						$( '#category-navigation-container' )
						.append( '<ul data-role="listview" data-split-icon="star" data-split-theme="a" data-inset="false">' + html + '</ul>' )
						.trigger('create');
						
					break;
					}
				}
				
				//alert('done');
			}else{
				switch( activeBusinessView ){
				case "search_results":
					if( search_limit_start == 0 ){
					
						$( '#search-results-container' )
						.html( '<div align="center"><img src="img/no-results.png" style="display:block;"/></div>' )
						.trigger('create');
					
					}
				break;
				case "all":
				break;
				default:
					$( '#category-navigation-container' )
					.html( '<div align="center"><img src="img/no-results.png" style="display:block;"/></div>' );
				break;
				}
				
				refreshBusinessListing[ activeBusinessView ] = false;
			}
			
			$('a.navigate')
			.bind('click', function( e ){
				e.preventDefault();
				
				storeObject.active_business = $(this).attr('id');
				
				$.mobile.navigate( "#business-details", { transition : "none" });
			});
			
			activate_rate_it();
			handle_rating_popup_open();
			
			if( appLoad ){
				appLoad = false;
				//$.mobile.navigate( "#home-page", { transition : "none" } );
			}
		break;
		case "rate-business-listings":
			
			//temp might be optimized later to effect rating in all sections
			activeBusinessView = 'all';
			
			if( data.html.business_id ){
				
				var key = data.html.business_id;
				
				var value = storeBusinesses[ activeBusinessView ][key];
				
				value.rating = data.html.rating;
				value.rating_converted = data.html.rating_converted;
				
				storeBusinesses[ activeBusinessView ][key] = value;
				
				/*UPDATE RATING*/
				$('#business-details-rating-popup')
				.rateit( 'value', data.html.rating_converted );
				
				$('#business-details-rating-percent-popup')
				.text( data.html.rating + '%' );
				
				$( '#'+key )
				.find('.rateit')
				.rateit( 'value', data.html.rating_converted );
				
				/*DISPLAY FINISH BUTTON*/
				$('#rate-business-form')
				.find('.rate-form-finish')
				.text('Finish')
				.show();
				
				$('#rate-business-form')
				.find('.rate-form-submit')
				.hide();
				
				var storedData = getData( 'rated-businesses' );
				if( ! storedData ){
					var storedData = {};
				}
				
				storedData[key] = true;
				putData( 'rated-businesses' , storedData );
				
			}else{
				refreshBusinessListing[ activeBusinessView ] = false;
			}
			
			activate_rate_it();
			handle_rating_popup_open();
		break;
		case "search-business-listings":
			
			activeBusinessView = 'search_results';
			
			if( data.html.business ){
				var html = '';
				
				var last_id = '';
				
				currentIterationBusinessID[ activeBusinessView ] = '';
				
				$.each(data.html.business, function(key, value){
					
					if( ! firstBusinessID[ activeBusinessView ] ){
						firstBusinessID[ activeBusinessView ] = key;
					}
					
					if( ! currentIterationBusinessID[ activeBusinessView ] ){
						currentIterationBusinessID[ activeBusinessView ] = key;
					}
					
					html += prepare_business_listing_html( key , value , 'search-mode' );
					
					if( ( ! value.next_business_id ) && firstBusinessID[ activeBusinessView ] ){
						value.next_business_id = firstBusinessID[ activeBusinessView ];
					}
					
					if( ( ! value.prev_business_id ) && lastBusinessID[ activeBusinessView ] ){
						value.prev_business_id = lastBusinessID[ activeBusinessView ];
					}
					
					storeBusinesses[ activeBusinessView ][ key ] = value;
					
					last_id = key;
					
				});
				
				//UPDATE NEXT ID OF LAST BUSINESS FOR PREVIOUS ITERATION
				if( currentIterationBusinessID[ activeBusinessView ] && lastBusinessID[ activeBusinessView ] ){
					storeBusinesses[ activeBusinessView ][ lastBusinessID[ activeBusinessView ] ].next_business_id = currentIterationBusinessID[ activeBusinessView ];
				}else{
					storeBusinesses[ activeBusinessView ][ last_id ].next_business_id = currentIterationBusinessID[ activeBusinessView ];
				}
				
				//UPDATE PREV ID OF FIRST BUSINESS FOR FIRST ITERATION
				if( firstBusinessID[ activeBusinessView ] && last_id ){
					storeBusinesses[ activeBusinessView ][ firstBusinessID[ activeBusinessView ] ].prev_business_id = last_id;
				}
				
				lastBusinessID[ activeBusinessView ] = last_id;
				
				//console.log( 'search-businesses' , storeBusinesses );
				
				if( data.html.limit_start ){
					search_limit_start = data.html.limit_start;
				}
				
				if( html ){
					$( '#search-results-container' )
					.append( '<ul data-role="listview" data-split-icon="star" data-split-theme="a" data-inset="false">' + html + '</ul>' )
					.trigger('create');
				}
				
				//alert('done');
			}else{
				refreshBusinessListing[ activeBusinessView ] = false;
			}
			
			$('a.navigate')
			.bind('click', function(){
				
				storeObject.active_business = $(this).attr('id');
				
				$.mobile.navigate( "#business-details", { transition : "none" });
			});
			
			activate_rate_it();
		break;
		}
	}
	
	
};

//Bind Multi-select option tooltip
var timer_interval;
var mouse_vertical_position;

var progress_bar_timer_id;
function progress_bar_change(){
	var total = 20;
	var step = 1;
	
	if(function_click_process==0){
		var $progress = $('#virtual-progress-bar').find('.progress-bar');
		
		if($progress.data('step') && $progress.data('step')!='undefined'){
			step = $progress.data('step');
		}
		
		var percentage_step = (step/total)*100;
		++step;
		
		if( percentage_step > 100 ){
			$progress
			.css('width', '100%');
			
			$('#virtual-progress-bar')
			.remove();
			
			$('.progress-bar-container')
			.html('');
			
			//Refresh Page
			function_click_process = 1;
			
			++requestRetryCount;
			
			//Stop All Processing
			window.stop();
			
			//check retry count
			if( requestRetryCount > 1 ){
				//display no network access msg
				//requestRetryCount = 0;
				
				var settings = {
					message_title:'No Network Access',
					message_message: 'The request was taking too long!',
					auto_close: 'no'
				};
				
			}else{
				//display retrying msg
				
				var settings = {
					message_title:'Refreshing...',
					message_message: 'Please Wait.',
					auto_close: 'yes'
				};
				
				//request resources again
				ajax_send();
				
			}
			display_popup_notice( settings );
			
		}else{
			$progress
			.data('step',step)
			.css('width', percentage_step+'%');
			
			progress_bar_timer_id = setTimeout(function(){
				progress_bar_change();
			},1000);
		}
	}else{
		$('#virtual-progress-bar')
		.find('.progress-bar')
		.css('width', '100%');
		
		setTimeout(function(){
			$('#virtual-progress-bar')
			.remove();
			
			$('.progress-bar-container')
			.html('');
		},800);
	}
};

//Display Notification Pop-up
function display_popup_notice( settings ){
	
	var theme = 'a';
	
	var html = settings.message_title + "\n" + settings.message_message;
	
	alert( html );
	/*
	var html = '<div data-role="popup" id="errorNotice" data-position-to="#" data-theme="'+theme+'" data-overlay-theme="b" data-dismissible="true">';
		html = html + '<div role="main" class="ui-content">';
		html = html + '<h3>'+settings.message_title+'</h3>';
		html = html + '<p>'+settings.message_message+'</p>';
	html = html + '</div></div>';
	
	$('#notification-popup')
	.html( html )
	.trigger("create");
		
	//Close All Pop-ups
	if( $('.ui-popup') ){
		$('.ui-popup')
		.popup("close");
	}
	
	$('#errorNotice')
	.popup("open");
	
	if( settings.auto_close ){
		switch( settings.auto_close ){
		case "yes":
			setTimeout(function(){
				$("#errorNotice")
				.popup("close");
			}, 3000 );
		break;
		}
	}
	
	$( "#errorNotice" ).on( "popupafterclose", function( event, ui ) {
		$('#errorNotice').remove();
	});
	*/
};

function activate_bar_chart( data ){
	return false;
	
	$.jqplot.config.enablePlugins = true;
  
	if( ! ( data.id && data.label) ){
		return false
	}
	
	if( data.value ){
		var dataset = new Array();
		dataset[0] = data.value;
		var color = ['#ff6600'];
	}
	
	if( data.value1 && data.value2 ){
		var dataset = new Array();
		dataset[0] = data.value1;
		dataset[1] = data.value2;
		var color = ['#ccc','#ff6600'];
	}
	
	if( ! dataset ){
		
		return false;
	}
	//var s61 = [7,8,11,16,21];
	
	var ticks6 = data.label;
	
	$('#'+ticks6)
	.html('');
	
	var chart = {
		// Only animate if we're not using excanvas (not in IE 7 or IE 8)..
		animate: !$.jqplot.use_excanvas,
		seriesColors:color,
		seriesDefaults:{
			pointLabels: { show: true},
			renderer:$.jqplot.BarRenderer,
			
			rendererOptions: { barDirection: 'horizontal', barPadding: 0,fillToZero: true},
			shadow:false,
			background: '#4bb2cf',
		},
			series:data.axislabel,
			legend: {
			 
			
		},
		
		grid: {
			gridLineColor: '#fff',
			borderWidth: 1.0,
			background: '#fff',
			borderColor: '#fff',
			shadow: false
		
		},
		
		axes: {
			xaxis: {
				showTicks: false
			},
			
			yaxis: {
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: ticks6,
				
			}
		}
	};
	
	plot6 = $.jqplot( data.id , dataset, chart );
};

function formatNum(n) {
  var n = ('' + n).split('.');
  var num = n[0];
  var dec = n[1];
  var r, s, t;

  if (num.length > 3) {
	s = num.length % 3;

	if (s) {
	  t = num.substring(0,s);
	  num = t + num.substring(s).replace(/(\d{3})/g, ",$1");
	} else {
	  num = num.substring(s).replace(/(\d{3})/g, ",$1").substring(1);
	}
  }

  if (dec && dec.length > 3) {
	dec = dec.replace(/(\d{3})/g, "$1 ");
  }

  return num + (dec? '.' + dec : '');
};

function piechart( data ){
	if( data.id && data.dataset ){
		
		$( data.id ).highcharts({
			chart: {
				plotBackgroundColor: null,
				plotBorderWidth: null,
				plotShadow: false
			},
			title: {
			   text: ''
			},
			tooltip: {
				pointFormat: '{series.name}: N<b>{point.y}</b>'
			},
			
			plotOptions: {
			   pie: {
						allowPointSelect: true,
						cursor: 'pointer',
						dataLabels: {
							enabled: false
						},
						showInLegend: true
					}
			},
			series: [{
				type: 'pie',
				name: 'Total sale today',
				data: data.dataset,
			}]
		});
	}
};