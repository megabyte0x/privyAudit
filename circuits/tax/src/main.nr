struct RawData {
    total_received: Field,
    total_expenses: Field,
}

fn calculate_tax(total_income: Field) -> Field {
    let mut income_tax = 0;
    let income = total_income as u64;

    if (income < 400000) {
        income_tax = 0;
    } else if (income >= 400000 & income < 800000) {
        income_tax = (income - 400000) * 5 / 100;
    } else if (income >= 800000 & income < 1200000) {
        income_tax = 20000 + (((income - 800000) * 10) / 100);
    } else if (income >= 1200000 & income < 1600000) {
        income_tax = 60000 + (((income - 1200000) * 15) / 100);
    } else if (income >= 1600000 & income < 2000000) {
        income_tax = 120000 + (((income - 1600000) * 20) / 100);
    } else if (income >= 2000000 & income < 2400000) {
        income_tax = 200000 + (((income - 2000000) * 25) / 100);
    } else {
        income_tax = 300000 + (((income - 2400000) * 30) / 100);
    }
    if (income < 1200000) {
        income_tax = 0;
    }
    income_tax as Field
}

fn main(raw_data: RawData, input_tax: pub Field) {
    // TODO: Add constraints
    let total_income = raw_data.total_received - raw_data.total_expenses;
    let calculated_tax = calculate_tax(total_income);
    assert(calculated_tax == input_tax, "Tax calculation is incorrect");
}

#[test]
fn calculate_tax_test() {
    let total_income = 120000;
    let input_tax = calculate_tax(total_income);
    assert(input_tax == 0);
}

#[test(should_fail)]
fn calculate_tax_test_2() {
    let total_income = 1200001;
    let input_tax = calculate_tax(total_income);
    assert(input_tax == 0);
}
