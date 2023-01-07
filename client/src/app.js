const limit_device = (e) => {
	const dataSet = Object.assign({}, e.currentTarget.parentElement.dataset);
	if (Object.values(dataSet).includes("")) return;

	Object.assign(dialogs.limit.dataset, dataSet);
	dialogs.limit.setAttribute("open", true);

	dialogs.limit.querySelector("h1 span").innerHTML = dataSet.deviceName;
};

const close_dialog = (e) => {
	if (e.target.nodeName === "DIALOG") e.currentTarget.removeAttribute("open");
};

window.onload = () => {
	// Find all filterlist add buttons and add event listener
	document.querySelectorAll(".FilterList h3 span").forEach((button) => {
		button.addEventListener("click", (e) => {
			const dataset = Object.assign({}, e.currentTarget.dataset);
			console.log(dataset)
			Object.assign(dialogs.filterlist.dataset, dataset);
			dialogs.filterlist.setAttribute("open", true);

			dialogs.filterlist.querySelector("h1 span").innerHTML = dataset.type;
		});
	});

	// Find all dialogs and add event listener
	document.querySelectorAll("dialog").forEach((dialog) => {
		dialog.addEventListener("click", close_dialog);
	});

	Object.keys(dialogs).forEach((key) => {
		dialogs[key]
			.querySelector("form")
			.addEventListener("submit", onSubmitHandlers[key]);
	});

	// add on blur event listener to window
	window.addEventListener("blur", () => {
		window.focused = false;
	});

	// add on focus event listener to window
	window.addEventListener("focus", () => {
		window.focused = true;
		fetch_connectedDevices();
		fetch_filterlist();
	});

	// dispatch on focus event
	window.dispatchEvent(new Event("focus"));
};
