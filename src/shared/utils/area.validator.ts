import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'areaValidator', async: false })
export class AreaValidator implements ValidatorConstraintInterface {
  validate(farm: any, args: ValidationArguments) {
    const { totalArea, arableArea, vegetationArea } = farm;
    return (arableArea + vegetationArea) <= totalArea;
  }

  defaultMessage(args: ValidationArguments) {
    return 'The sum of arable area and vegetation area cannot exceed the total area of the farm';
  }
}
