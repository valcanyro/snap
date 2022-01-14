function createVirtualList(listbox, listvalues, createRow){
	while (listbox.firstChild) {
		listbox.removeChild(listbox.firstChild);
	}

	//Firefox max scroll height 17895697px ~ 994205 rows at 18px per row
	//Rows blank out after around 466040 Rows
	//Safe max 466000 rows

	let virtuallist = {
		listbox: listbox,
		list: $insert(listbox, 'div', {class: 'list'}),
		values: listvalues,
		viewportheight: listbox.offsetHeight,
		rows: new Map(),
		rowheight: 18,
		wait: false,
		createRow: createRow,
	}

	virtuallist.refreshList = function(){
		this.rows.forEach(r => $remove(r));
		this.rows.clear();

		this.list.style.height = `${this.rowheight * this.values.length}px`;
		this.renderRows();
	}

	virtuallist.renderRows = function(){
		let scrolly = this.listbox.scrollTop;

		let top = Math.max(0, Math.floor(scrolly / this.rowheight));
		let bottom = Math.min(this.values.length - 1, Math.ceil((scrolly + this.viewportheight) / this.rowheight));

		for (let [i, r] of this.rows.entries()){
			if (i < top || i > bottom){
				$remove(r);
				this.rows.delete(i);
			}
		}
		// add new rows
		for (let i = top; i <= bottom; i++){
			if (!this.rows.has(i)){
				let rowelem = createRow(this.values[i]);
				rowelem.style.top = `${i * this.rowheight}px`;
				this.rows.set(i, rowelem);
				this.list.appendChild(rowelem);
			}
		}
	}

	virtuallist.updateList = function(newlistvalues){
		this.values = newlistvalues;
		this.refreshList();
	}

	listbox.onscroll = () => {
		if (!virtuallist.wait){
			virtuallist.wait = true;
			window.requestAnimationFrame(() => {
				virtuallist.renderRows();
				virtuallist.wait = false;
			});
		}
	};

	let initialrows = 10;
	let defaultheight = ((initialrows < listvalues.length) ? initialrows * virtuallist.rowheight : listvalues.length * virtuallist.rowheight + 18);
	listbox.style.height = `${defaultheight}px`;

	let resize = new ResizeObserver(entries => {
		virtuallist.viewportheight = entries.pop().borderBoxSize[0].blockSize;
		virtuallist.renderRows();
	});
	globalrunningobservers.push(resize);
	resize.observe(listbox);

	virtuallist.refreshList();

	return virtuallist;
}

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

//assumes list is already in descending order
function searchResult(sbox, list){
	let input = $(sbox, 'input').value;

	let results = [];
	for (let l of list){
		let result = RegExp(`^(.*?)(${input})(.*?)$`, 'gi').exec(l);
		if (result){
			results.push(result);
		}
	}

	if ($(sbox, '.search-sort').getAttribute('data-sort') === 'ascend'){
		results.reverse();
	}

	return results;
}

function showSearchClear(sbox){
	let clearbutton = $(sbox, '.search-clear');
	if ($(sbox, 'input').value){
		clearbutton.classList.remove('hide');
	}
	else {
		clearbutton.classList.add('hide');
	}
}

function setupSearch(vlist, sbox, values){
	let searchinput = $(sbox, 'input');
	searchinput.oninput = () => {
		vlist.updateList(searchResult(sbox, values));
		showSearchClear(sbox);
	};
	$(sbox, 'button.search-clear').onclick = () => {
		searchinput.value = '';
		vlist.updateList(searchResult(sbox, values));
		showSearchClear(sbox);
	}
	$(sbox, 'button.search-sort').onclick = () => {
		toggleListSort(sbox);
		vlist.updateList(searchResult(sbox, values));
	}
	showSearchClear(sbox);
}

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

function toggleListSort(sbox){
	let sortbutton = $(sbox, 'button.search-sort');
	let sorticon = $(sortbutton, 'i');

	if (sortbutton.getAttribute('data-sort') === 'descend'){
		sortbutton.setAttribute('data-sort', 'ascend');
		sortbutton.title = 'Sorted by ascending'
		sorticon.className = 'icon-ascend';
	}
	else {
		sortbutton.setAttribute('data-sort', 'descend');
		sortbutton.title = 'Sorted by descending'
		sorticon.className = 'icon-descend';
	}
}