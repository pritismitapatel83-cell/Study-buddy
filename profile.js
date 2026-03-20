const editBtn = document.querySelector(".profile-box button");

let isEditing = false;

editBtn.addEventListener("click", () => {
    const profileBox = document.querySelector(".profile-box");

    if (!isEditing) {
        // Convert text to input fields
        const name = profileBox.querySelector("h2").innerText;
        const course = profileBox.querySelectorAll("p")[0].innerText.replace("Course: ", "");
        const semester = profileBox.querySelectorAll("p")[1].innerText.replace("Semester: ", "");
        const email = profileBox.querySelectorAll("p")[2].innerText.replace("Email: ", "");

        profileBox.querySelector("h2").innerHTML =
            `<input type="text" id="name" value="${name}">`;

        profileBox.querySelectorAll("p")[0].innerHTML =
            `Course: <input type="text" id="course" value="${course}">`;

        profileBox.querySelectorAll("p")[1].innerHTML =
            `Semester: <input type="text" id="semester" value="${semester}">`;

        profileBox.querySelectorAll("p")[2].innerHTML =
            `Email: <input type="email" id="email" value="${email}">`;

        editBtn.innerText = "Save Profile";
        isEditing = true;

    } else {
        // Save data back to text
        const name = document.getElementById("name").value;
        const course = document.getElementById("course").value;
        const semester = document.getElementById("semester").value;
        const email = document.getElementById("email").value;

        profileBox.querySelector("h2").innerText = name;
        profileBox.querySelectorAll("p")[0].innerText = `Course: ${course}`;
        profileBox.querySelectorAll("p")[1].innerText = `Semester: ${semester}`;
        profileBox.querySelectorAll("p")[2].innerText = `Email: ${email}`;

        editBtn.innerText = "Edit Profile";
        isEditing = false;
    }
});