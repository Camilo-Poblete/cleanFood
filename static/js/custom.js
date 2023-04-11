let autocomplete;


function initAutoComplete(){
autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('id_address'),
    {
        types: ['geocode', 'establishment'],
        //default in this app is "IN" - add your country code
        componentRestrictions: {'country': ['NG']},
    });
   // id_address.focus(); 


// When the user selects an address from the drop-down, populate the
// address fields in the form.
autocomplete.addListener('place_changed', onPlaceChanged);
}


function onPlaceChanged (){
    const place = autocomplete.getPlace();

    // User did not select the prediction. Reset the input field or alert()
    if (!place.geometry){
        document.getElementById('id_address').placeholder = "Start typing...";
    }
    else{
        // console.log('place name=>', place.name)
    }
    
    
    // get the address components and assign them to the fields
    var geocoder = new google.maps.Geocoder();
    var address = document.getElementById('id_address').value;

    geocoder.geocode({'address': address}, function(results, status){
        
        if(status == google.maps.GeocoderStatus.OK){
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();

            // console.log('lat=>', latitude);
            // console.log('long =>', longitude);
            
            $('#id_latitude').val(latitude);
            $('#id_longitude').val(longitude);
            $('id_address').val(address);
        }
    });

    // loop through the address components and assign other address data
    // console.log(place.address_components);
    for(var i=0; i<place.address_components.length; i++){
        for(var j=0; j<place.address_components[i].types.length; j++){
            
            // get country
            if(place.address_components[i].types[j] == 'country'){
                $('#id_country').val(place.address_components[i].long_name);
            }

            // get state
            if(place.address_components[i].types[j] == 'administrative_area_level_1'){
                $('#id_state').val(place.address_components[i].long_name);
            }

             // get city
             if(place.address_components[i].types[j] == 'locality'){
                $('#id_city').val(place.address_components[i].long_name);
            }

             // get postal code
             if(place.address_components[i].types[j] == 'postal_code'){
                $('#id_pin_code').val(place.address_components[i].long_name);
            }else{
                $('#id_pin_code').val("");
            }
        }
    }
  
}




//Cart
$(document).ready(function(){

    // ADD TO CART
    $('.add_to_cart').on('click', function(e){
        e.preventDefault();
        food_id = $(this).attr('data-id');
        url = $(this).attr('data-url');

        
        $.ajax({
            type: 'GET',
            url: url,
            success: function(response){
                if(response.status == 'login_required'){
                    swal(response.message, '', 'info').then(function(){
                        window.location = '/login';
                    })
                }else if(response.status == 'failed'){ 
                    swal(response.message, '', 'error')
                }else{
                    $('#cart_counter').html(response.cart_counter['cart_count']);
                    $('#qty-'+food_id).html(response.qty);

                    // subtotal, tax and grand total
                    applyCartamounts(
                        response.cart_amount['subtotal'],
                        response.cart_amount['tax_dict'],
                        response.cart_amount['grand_total']
                    )
                }
            }
        })
    })

    // Place the cart Item quantity on load
    $('.item-qty').each(function(){
        var the_id = $(this).attr('id')
        var qty = $(this).attr('data-qty')
        $('#'+the_id).html(qty)
    })


    // DECREASE CART
    $('.decrease_cart').on('click', function(e){
        e.preventDefault();
    
        food_id = $(this).attr('data-id');
        url = $(this).attr('data-url');
        cart_id = $(this).attr('id');
    
           
        $.ajax({
            type: 'GET',
            url: url,
            success: function(response){
                // console.log(response);
                if(response.status == 'login_required'){
                    swal(response.message, '', 'info').then(function(){
                        window.location = '/login';
                    })
                }else if(response.status == 'Failed'){
                    swal(response.message, '', 'error')
                }else{
                    $('#cart_counter').html(response.cart_counter['cart_count']);
                    $('#qty-'+food_id).html(response.qty);

                    applyCartamounts(
                        response.cart_amount['subtotal'],
                        response.cart_amount['tax_dict'],
                        response.cart_amount['grand_total']
                    )

                    if(window.location.pathname == '/cart/'){
                        removeCartItem(response.qty, cart_id);
                        checkEmptyCart();
                    }   
                }   
            }
        })
    })


    // DELETE CART ITEM
    $('.delete_cart').on('click', function(e){
        e.preventDefault();
    
        cart_id = $(this).attr('data-id');
        url = $(this).attr('data-url');
    
           
        $.ajax({
            type: 'GET',
            url: url,
            success: function(response){
                if(response.status == 'Failed'){
                    swal(response.message, '', 'error')
                }else{
                    $('#cart_counter').html(response.cart_counter['cart_count']);
                    swal(response.status, response.message, 'SUCCESS')

                    applyCartamounts(
                        response.cart_amount['subtotal'],
                        response.cart_amount['tax_dict'],
                        response.cart_amount['grand_total']
                    )

                    removeCartItem(0, cart_id);
                    checkEmptyCart();           
                }   
            }
        })
    })

    // Delete the Cart element if the Quantity is 0
    function removeCartItem(cartItemQty, cart_id){
            if(cartItemQty <= 0){
                // Remove the Cart item element
                document.getElementById("cart-item-"+cart_id).remove()
            }
    
    }


    //Check if the Cart is empty
    function checkEmptyCart(){
        var cart_counter = document.getElementById('cart_counter').innerHTML
        if(cart_counter == 0){
            document.getElementById('empty-cart').style.display = "block";
        }
    }


    //Apply cart amount
    function applyCartamounts(subtotal, tax_dict, grand_total){
        if(window.location.pathname == '/cart/'){
            $('#subtotal').html(subtotal);
            $('#total').html(grand_total);


            for(key1 in tax_dict){ 
                for (key2 in tax_dict[key1]){
                    $('#tax-'+key1).html(tax_dict[key1][key2])
                }
            }
        }
    }


    // ADD OPENING HOURS
    $('.add_hour').on('click', function(e){
        e.preventDefault();
        var day = document.getElementById('id_day').value
        var from_hour= document.getElementById('id_from_hour').value
        var to_hour= document.getElementById('id_to_hour').value
        var is_closed= document.getElementById('id_is_closed').checked
        var csrf_token = $('input[name=csrfmiddlewaretoken]').val()
        var url = document.getElementById('add_hour_url').value


        if(is_closed){
            is_closed = 'True'
            condition = "day != '' "
        }else{
            is_closed = 'False'
            condition = "day != '' && from_hour != '' && to_hour != ''"
        }

        if(eval(condition)){
            $.ajax({
                type: 'POST',
                url: url,
                data:{
                    'day': day,
                    'from_hour': from_hour,
                    'to_hour': to_hour,
                    'is_closed': is_closed,
                    'csrfmiddlewaretoken': csrf_token
                },
                success: function(response){
                    if(response.status == 'success'){
                        if(response.is_closed == 'Closed'){
                            html='<tr id="hour-'+response.id+'"><td><b>'+response.day+'</b></td><td>Closed</td><td><a href="#" class="remove_hour" data-url="/vendor/opening-hours/remove/'+response.id+'/">Remove</a></td></tr>';
                        }else{
                            html = '<tr id="hour-'+response.id+'"><td><b>'+response.day+'</b></td><td>'+response.from_hour+' - '+response.to_hour+'</td><td><a href="#" class="remove_hour" data-url="/vendor/opening-hours/remove/'+response.id+'/">Remove</a></td></tr>';
                        }

                        $(".opening_hours").append(html)
                        document.getElementById("opening_hours").reset();
                    }else{
                        swal(response.message, '', "error")
                    }
                }

            })
        }else{
            swal('Please fill all fields', '', 'info')
        }
    });

    // REMOVE OPENING HOURS
    $(document).on('click', '.remove_hour', function(e){
        e.preventDefault();
        url = $(this).attr('data-url');

        $.ajax({
            type: 'GET',
            url: url,
            success: function(response){
                if(response.status == 'success'){
                    document.getElementById('hour-'+response.id).remove()
                }
            }
        })
    })

});




