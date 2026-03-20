function addTask() {
    const task = document.getElementById("task").value;
    const date = document.getElementById("date").value;

    if (task === "" || date === "") {
        alert("Please enter task and date");
        return;
    }

    const li = document.createElement("li");
    li.innerHTML = `<span>📘 ${task}</span><small>${date}</small>`;

    document.getElementById("taskList").appendChild(li);

    document.getElementById("task").value = "";
    document.getElementById("date").value = "";
}