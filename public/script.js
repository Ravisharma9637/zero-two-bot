console.log("Zero Two Website Loaded");

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

card.addEventListener("mouseenter",()=>{

card.style.boxShadow="0 0 30px hotpink";

});

card.addEventListener("mouseleave",()=>{

card.style.boxShadow="none";

});

});